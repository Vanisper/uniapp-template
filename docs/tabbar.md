# TabBar 与页面导航

自定义 TabBar 分为基础组件、动画组件和页面接入层。页面状态来自真实页面栈，动画中的预选项只保存在动画组件内部。

## 选择样式

在 `src/configs/theme.ts` 的 `createThemeConfig()` 中配置：

```ts
const tabbar = {
  mode: 'custom',
  variant: 'animated', // 可改为 'basic'
  height: 50,
}
```

`mode` 决定使用原生还是自定义 TabBar；`variant` 仅选择自定义组件的样式。当前配置使用动画版，两个页面布局共用 `AppPageTabbar`，切换样式无需修改布局。

## 目录与职责

`Tabbar/` 归集通用标签栏及其扩展，`App/` 放置应用接入组件。动画版有独立的实现、类型和测试，集中在 `Tabbar/Animated/` 中。

```text
src/components/
├── Tabbar/
│   ├── index.vue          # 基础入口：Tabbar
│   ├── type.ts            # 基础属性、事件与插槽契约
│   ├── selection.ts       # 选中项解析
│   ├── index.test.ts
│   └── Animated/
│       ├── index.vue      # 动画扩展：TabbarAnimated
│       ├── type.ts        # 动画属性与取消接口
│       └── index.test.ts
└── App/
    ├── PageTabbar.vue      # 应用接入：AppPageTabbar
    └── PageTabbar.test.ts
```

项目使用目录命名空间生成组件名，显式导入也沿用 `Tabbar`、`TabbarAnimated`、`AppPageTabbar`，让模板中的名称与目录归属一致。

| 层级 | 模块 | 职责 |
| --- | --- | --- |
| 通用基础 | `Tabbar` | 等分排列、字段映射、受控选中、选择事件，提供指示器和标签内容插槽 |
| 通用扩展 | `TabbarAnimated` | 组合 `Tabbar`，管理胶囊与文字过渡、视觉预选、延迟请求和取消 |
| 应用接入 | `AppPageTabbar` | 从页面配置取得列表、选择底栏样式、绑定真实路由、执行导航并反馈失败，隐藏原生栏，处理缓存页隐藏 |
| 页面能力 | `usePages` | 页面查询、真实页面栈同步和导航结果 |
| 布局能力 | `useLayout` | 根据页面配置计算导航栏与 TabBar 的显隐、尺寸 |

布局统一使用 `AppPageTabbar`，由它选择 `Tabbar` 或 `TabbarAnimated`；动画版再通过基础组件的属性、事件与插槽完成组合。依赖从应用接入层指向通用组件，动画扩展指向基础组件。

基础组件与动画组件均不依赖 `uni`、应用主题、页面配置或路由模块。基础类型只描述基础契约，动画类型在 `Animated/type.ts` 中继承基础属性并增加切换确认与取消接口。`usePages`、`useLayout` 不保存动画索引，也不读取动画时长。

## 组件契约

两种组件都保留 `list`、`defaultValue`、`valueField`、`textField`、`height`、`color`、`activeColor`。`defaultValue` 沿用旧名称，但实际是受控选中值：字符串按 `valueField` 匹配，数字表示索引；无效值回退到首项，空列表没有选中项。列表项应提供唯一、稳定的值。

基础版点击非活动项立即发出 `change(selection, item)`，其中 `selection` 包含映射后的 `value` 和 `text`。它不会自行改变选中值，父级应更新受控值。`indicator` 插槽可取得当前索引与项数，`item` 插槽可取得列表项、索引、激活状态及映射后的值和文本。

动画版先预览目标，经过 260ms 过渡后提交选择。该等待属于动画版的交互策略。H5 系统设置为减少动态效果时，视觉过渡和提交等待都关闭。

`change` 是选择请求，最终选中仍由 `defaultValue` 决定；事件发出后父级没有更新受控值时，动画版会回到原选中项。

动画版可以传入 `beforeChange(selection, item)`：

- 返回 `false` 或 Promise 拒绝时，取消选择并恢复受控值
- 返回其他值或 Promise 成功时，发出 `change` 事件
- 异步处理期间不提交新请求，避免重复操作

`AppPageTabbar` 将导航作为动画版的 `beforeChange`。导航已经在该回调中执行，不能再通过动画版的 `change` 重复导航。

## 取消与失败

动画等待期间，点回实际当前项会取消请求，连续选择以最后一次为准。外部选中值、列表或字段映射变化会使过期选择失效；卸载同样取消尚未提交的请求。

异步回调已经发出的操作不能由动画组件撤销。组件会忽略过期结果，防止其覆盖后续受控状态。动画组件提供 `cancel()` 方法，取消待提交选择并恢复受控值。`AppPageTabbar` 在页面隐藏时调用该方法，并使旧导航的失败提示失效。

页面可见性由页面容器负责，`AppPageTabbar` 不通过 `onHide/onShow` 另行控制组件显隐。H5 对当前 tab 再次执行 `switchTab` 时可能只触发 `onHide`，不能依赖随后一定出现 `onShow` 来恢复底栏。

导航失败由 `AppPageTabbar` 提示并允许重试。基础版始终展示受控值；动画版回到真实选中项，不把失败目标写入全局路由。

## 页面状态同步

`main.ts` 在应用创建时调用 `setupPages(app)`，集中注册页面显示、就绪生命周期及导航 API 完成拦截器。布局不再调用 `syncPageStack()`。

保留两类同步入口是因为它们覆盖不同场景：API 拦截器处理程序导航，页面生命周期处理原生 tab 点击、返回及页面再次显示。微信原生 tab 点击不一定调用 `uni.switchTab`，详见 [uni-app 拦截器文档](https://uniapp.dcloud.net.cn/api/interceptor)。

`currentRoute` 始终派生自真实页面栈，不使用待完成目标覆盖。`go()`、`goHome()`、`goBack()` 返回 `Promise<boolean>`，表示对应导航 API 的成功或失败；实际页面变化由页面栈同步反映。导航目标使用应用根路径，有无前导 `/` 均可。

## 与旧动画案例的关系

`ad94557` 的设计记录保存在 `docs/superpowers`，用于说明当时实现。当前实现保留页面栈刷新的通用修复，将动画从基础组件分离，移除了共享目标路由对当前页面的覆盖。

若需要点击立即导航、同时保留跨页连续动画，应另外验证持久 TabBar 容器在各端的承载方式。当前动画版采用组件内部先过渡、后提交的方式，不依赖跨页保留实例。
