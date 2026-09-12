# TabBar 与页面导航

自定义 TabBar 由基础组件、动画扩展和页面接入层组成。页面展示使用所属页面的固定路由，导航判断使用真实活动路由，视觉预选保存在动画组件内部。

## 配置与接入

在 `src/configs/theme.ts` 中通过 `tabbar.mode` 选择原生或自定义 TabBar。自定义模式下，`tabbar.variant` 支持 `basic`（基础版）和 `animated`（动画版）。

`default` 与 `tabbar` 布局统一使用 `AppPageTabbar`，由它选择具体样式；`TabbarAnimated` 通过组合 `Tabbar` 实现动画。

## 模块职责

| 模块 | 位置 | 职责 |
| --- | --- | --- |
| `Tabbar` | `src/components/Tabbar/` | 等分排列、字段映射、受控选择，以及装饰和内容插槽 |
| `TabbarAnimated` | `src/components/Tabbar/Animated/` | 胶囊与文字过渡、视觉预选、延迟确认和取消 |
| `AppPageTabbar` | `src/components/App/PageTabbar.vue` | 读取配置、绑定所属页路由、执行导航、反馈失败及处理页面隐藏 |
| `usePages` | `src/composables/usePages/` | 查询页面配置、真实页面栈与活动路由，执行导航 |
| `usePageRoute` | `src/composables/usePageRoute/` | 获取组件所属页面的固定路由 |
| `useLayout` | `src/composables/useLayout/` | 按所属页面配置计算导航栏、底栏和内容区域尺寸 |

组件名与目录命名空间一致，类型和测试放在对应模块内。依赖从页面接入层指向通用组件、从动画扩展指向基础组件；通用组件的输入通过属性、事件和插槽传递。

## 受控选择

两种组件共用 `list`、`value`、`valueField`、`textField`、`height`、`color` 和 `activeColor`。

- `value` 为字符串时，按 `valueField` 匹配；为整数时，作为列表索引
- 未传或无效的 `value` 选中首项；空列表的选中索引为 `-1`
- `valueField`、`textField` 默认分别为 `value`、`text`，列表项的值应唯一且稳定
- `height` 单位为 px，安全区由页面布局处理

基础版点击非活动项立即发出 `change(selection, item)`。`selection` 包含映射后的 `value` 和 `text`，`item` 是原始列表项；最终选中由父级更新 `value` 确认。

基础组件提供两个插槽：

- `indicator`：底栏装饰，取得当前索引 `index` 和标签数量 `count`
- `item`：标签内容，取得原始项、索引、活动状态及映射后的值和文字

## 动画交互

动画版按以下顺序处理选择：

1. 用户点击非活动项，预览目标并播放 260ms 胶囊与文字过渡
2. 过渡结束后执行可选的 `beforeChange(selection, item)`，等待返回结果
3. 确认通过后发出 `change`，随后同步到父级提供的受控值

`beforeChange` 返回 `false`、抛出异常或 Promise 拒绝时取消选择；返回 `true`、`undefined` 或对应的 Promise 结果时确认选择。等待确认期间忽略新的点击请求。

动画等待期间，连续选择以最后一次为准，点回实际当前项取消选择。确认期间 `value` 同步为本次目标时保留请求，其余 `value` 更新以及列表、字段映射或确认回调变化会使请求失效。组件停用、卸载及调用 `cancel()` 也会取消请求并恢复受控值。已经开始的回调操作由调用方负责，动画组件只忽略其过期结果。

只有用户发起的视觉预选播放过渡。初始化、受控同步、取消和恢复直接就位；H5 开启减少动态效果时，同时关闭过渡与提交等待。

## 页面接入

`AppPageTabbar` 使用 `pages.json` 中的 `tabBar.list`，以 `pagePath` 映射标签值，并通过 `usePageRoute()` 绑定所属页面。

基础版在 `change` 中导航；动画版将导航交给 `beforeChange`，每次选择只执行一次导航。导航进行中忽略重复请求，失败时提示重试；页面隐藏或卸载后，进行中请求的失败提示失效。页面隐藏同时调用动画组件的 `cancel()`。

页面容器负责底栏的展示与生命周期。H5 同 tab 导航可能只触发 `onHide`，因此该钩子只用于交互清理，底栏显示由所属页面的布局配置决定。微信通过页面配置启用自定义底栏，其他平台在组件挂载和页面显示时调用 `hideTabBar()`。

## 页面归属与状态同步

`usePageRoute()` 在 setup 中沿 Vue 父级读取所属页面的固定路由，没有页面上下文时返回 `undefined`。底栏选中项、导航栏标题和布局尺寸使用该路由，缓存页面和异步子组件都保持各自的页面状态。

`usePages().currentRoute` 表示真实页面栈的活动路由。`main.ts` 在应用创建时调用 `setupPages(app)`，通过页面显示、就绪生命周期及导航 API 完成拦截器刷新页面栈。两类入口分别覆盖原生 tab 点击、系统返回和程序导航等场景。

`go()`、`goHome()`、`goBack()` 返回 `Promise<boolean>`，表示导航 API 的成功或失败；页面显示状态由实际页面栈反映。导航目标使用应用根路径，有无前导 `/` 均可，普通页面可以携带查询参数。

当前自定义底栏是所属页面内的 `view`，随页面渲染实例切换，不提供跨页持久渲染层。小程序各页面实例的交接仍需在目标设备上验证。[DCloud 自定义 tabBar](https://uniapp.dcloud.net.cn/collocation/pages.html#custom-tab-bar)、[微信自定义 tabBar](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/custom-tabbar.html)
