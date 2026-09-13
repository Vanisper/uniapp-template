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
| `AppPageTabbar` | `src/components/App/PageTabbar.vue` | 读取配置、绑定所属页路由、执行导航、反馈失败及适配页面生命周期 |
| `PageWrapper` | `src/components/App/PageWrapper.vue` | 确定页面可用高度，统一处理窗口偏移与安全区 |
| `usePages` | `src/composables/usePages/` | 查询页面配置与调用时的栈顶页面，执行导航 |
| `usePageRoute` | `src/composables/usePageRoute/` | 获取组件所属页面的固定路由 |
| `useLayout` | `src/composables/useLayout/` | 按所属页面配置计算导航栏、底栏和内容区域尺寸 |

组件名与目录命名空间一致，类型和测试放在对应模块内。依赖从页面接入层指向通用组件、从动画扩展指向基础组件；通用组件的输入通过属性、事件和插槽传递。

## 页面布局

`PageWrapper` 使用所属页面的 CSS 视口确定高度。自定义导航页在容器内部放置状态栏和导航栏占位，顶部安全区由这部分内容处理；使用默认导航时，顶部空间由平台或框架提供。

微信小程序使用原生 Tabbar 的页面，可用视口已排除底栏及其安全区，容器直接填满该视口；自定义 Tabbar 页和普通页面则预留底部安全区。是否存在原生 Tabbar 由配置模式和所属页面共同决定。

H5 使用框架的窗口偏移变量，它们已经包含安全区；自定义导航页的顶部偏移设为零，默认导航页保留框架的顶部偏移。H5 优先使用 `100dvh` 跟随可见视口变化，不支持时回退到 `100vh`。

默认布局的内容区使用 `flex: 1`、`min-height: 0` 和内部滚动。导航栏与 Tabbar 的占位保持各自配置的高度，Tabbar 相对页面容器底部定位，长内容滚动时位置不变。

`--tabbar-height` 表示页面内自定义底栏的占位高度，原生 Tabbar 页和普通页面为零。全局底部文字使用该变量定位，贴合当前页面的内容底部。

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

动画等待期间，连续选择以最后一次为准，点回实际当前项取消选择。确认期间 `value` 同步为本次目标时保留请求，其余 `value` 更新以及列表、字段映射或确认回调变化会使请求失效。组件停用、卸载及调用 `cancel()` 也会取消请求并恢复受控值。`cancel({ restore: false })` 取消请求并保留当前视觉选中项，适用于离场交接。已经开始的回调操作由调用方负责，动画组件只忽略其过期结果。

只有用户发起的视觉预选播放过渡。初始化、受控同步、取消和恢复直接就位；H5 开启减少动态效果时，同时关闭过渡与提交等待。

## 页面接入

`AppPageTabbar` 使用 `pages.json` 中的 `tabBar.list`，以 `pagePath` 映射标签值，并通过 `usePageRoute()` 绑定所属页面。

基础版在 `change` 中导航；动画版将导航交给 `beforeChange`，每次选择只执行一次导航。导航进行中忽略重复请求，失败时恢复选中项并提示重试；页面隐藏或卸载后，进行中请求的失败提示失效。

页面隐藏时取消动画请求。自身导航进行中保留已到达的目标位置，避免旧页面尚未退场时回弹。页面再次显示时同步所属选中项；导航失败时直接恢复，不依赖后续的页面显示事件。

平台适配集中在页面接入层，通过条件编译选择；导航与视觉预选保持同一套流程。

| 平台 | 原生底栏处理 | 隐藏页选中项恢复 |
| --- | --- | --- |
| H5 | 组件挂载、页面显示时调用 `hideTabBar()` | Vue 缓存组件停用时恢复，页面显示时再次同步 |
| 微信小程序 | 通过页面配置启用自定义底栏 | 支持 `onAppRouteDone` 时在转场完成后恢复，否则在页面显示时恢复 |
| 其他平台 | 组件挂载、页面显示时调用 `hideTabBar()` | 页面显示时同步 |

微信转场完成后无动画恢复隐藏页，使缓存视图在下次显示前就绪。事件目标必须与当前活动路由一致，且不是所属页面，避免迟到事件打断活动页的新预选。仅动画版且平台支持监听与取消监听时注册；注册与卸载使用同一个回调，具体时机见[微信页面路由监听](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/route-event-listener.html)。

页面容器负责底栏的展示与生命周期。H5 同 tab 导航可能只触发 `onHide`，因此该钩子只用于交互清理，底栏显示由所属页面的布局配置决定。

## 页面归属与即时查询

`usePageRoute()` 在 setup 中沿 Vue 父级读取所属页面的固定路由，没有页面上下文时返回 `undefined`。底栏选中项、导航栏标题和布局尺寸使用该路由，缓存页面和异步子组件都保持各自的页面状态。

`usePages().getCurrentPage()` 每次调用都从 `getCurrentPages()` 读取真实栈顶页面，并附加页面配置；空栈时返回 `undefined`。`AppPageTabbar` 在导航判断和微信转场完成事件中通过 `getCurrentPage()?.route` 查询活动路由，`goBack()` 在返回前直接读取真实栈长度。页面查询与导航统一由 `usePages` 提供，无需在应用启动时安装页面插件。

这些调用方只需要事件发生时的页面状态，因此不维护响应式页面栈，也无需生命周期或导航拦截器刷新缓存。若后续需要在模板中持续展示活动路由，应补充明确的响应式事件来源；仅将 `getCurrentPages()` 包在 `computed` 中不会随页面切换更新。

`go()`、`goHome()`、`goBack()` 返回 `Promise<boolean>`，表示导航 API 的成功或失败；页面显示状态由实际页面栈反映。导航目标使用应用根路径，有无前导 `/` 均可，普通页面可以携带查询参数。

当前自定义底栏是所属页面内的 `view`，随页面渲染实例切换，不提供跨页持久渲染层。小程序各页面实例的交接仍需在目标设备上验证。[DCloud 自定义 tabBar](https://uniapp.dcloud.net.cn/collocation/pages.html#custom-tab-bar)、[微信自定义 tabBar](https://developers.weixin.qq.com/miniprogram/dev/framework/ability/custom-tabbar.html)
