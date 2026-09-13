# TabBar 接入与组件契约

TabBar 的展示、选择交互和页面导航分层处理。组件接收受控值，页面接入层绑定所属路由并执行导航；动画中的预选状态由组件内部管理。

## 模式与组件选择

`src/configs/theme.ts` 中的 `tabbar.mode` 控制原生或自定义底栏，`tabbar.height` 控制自定义底栏的占位高度。

| 配置 | 值 | 行为 |
| --- | --- | --- |
| `tabbar.mode` | `default` | 使用平台底栏，页面布局不渲染 `AppPageTabbar` |
| `tabbar.mode` | `custom` | 使用页面内底栏，由接入层处理原生底栏隐藏 |
| `tabbar.height` | 数字 | 自定义底栏的完整占位高度，单位 px，不包含底部安全区 |

`pages.config.ts` 同样读取模式配置来生成平台设置，修改模式后应重新启动开发服务或重新构建。高度需要包含组件的抬升区域；当前配置为 72px，底部安全区统一由 `PageWrapper` 处理。

主 tab 页面及其底栏图标保留在主包。页面内容可以通过带有异步占位的组件交给分包，`AppPageTabbar` 继续根据主包页面路由处理选中与导航；内容迁移不改变底栏归属。相关约束见[分包归属](page-layouts.md#分包归属)。

具体组件在 `src/components/App/PageTabbar.vue` 中显式导入，主题配置只保留模式和高度。各组件按下表组合：

| 组件 | 导入位置 | 交互职责 |
| --- | --- | --- |
| 基础 `Tabbar` | `@/components/Tabbar/index.vue` | 图文排列、字段映射、受控选择，点击后立即发出 `change` |
| `TabbarAnimated` | `@/components/Tabbar/Animated/index.vue` | 共用基础组件的字段映射与排列样式，增加预选过渡、`beforeChange` 确认与 `cancel` |
| `TabbarRaised` | `@/components/Tabbar/Raised/index.vue` | 组合动画组件，以插槽提供凹槽和抬升图文，沿用同一套确认与取消交互 |

当前接入层导入 `Raised`。凹槽和抬起图标随当前预选项移动，选中状态仍来自相同的受控值与预选规则。

`Raised` 与 `Animated` 共用 `beforeChange` 和 `TabbarExpose`，替换时只需更改导入路径。换成基础组件时，将 `beforeChange` 改为 `@change` 绑定导航，并移除预选组件的 ref 与取消控制；列表、字段映射、颜色和高度参数保持一致。每次选择只保留一个导航触发点。

## 共用参数

三个组件共用 `TabbarProps` 中的列表、选中值、字段映射、高度与颜色参数。

| 参数 | 默认值或约定 |
| --- | --- |
| `list` | 标签列表，值字段应唯一且稳定 |
| `value` | 字符串按 `valueField` 匹配，整数表示列表索引 |
| `valueField` | `value` |
| `textField` | `text` |
| `iconField` | `iconPath` |
| `activeIconField` | `selectedIconPath` |
| `height` | 必填，单位 px |
| `color`、`activeColor` | 普通态与选中态文字颜色 |

未传或无效的 `value` 选中首项；空列表的选中索引为 `-1`。`change(selection, item)` 中的 `selection` 包含映射后的 `value` 和 `text`，`item` 是原始列表项；最终选中由调用方更新 `value` 确认。

图标路径按当前选中态读取，未配置选中图标时沿用普通态图标，未配置图标时保留文字。自定义组件将 `static/` 开头的路径补为 `/static/` 根路径，避免在子目录页面中被错误拼接；其他格式的路径保持不变。

## 展示扩展

基础组件通过插槽开放装饰与图文内容，点击和选择事件仍由组件处理。

- `indicator` 提供当前索引 `index` 与标签数量 `count`，空列表的索引为 `-1`
- `item` 提供原始项、索引、活动状态，以及映射后的值、文字与当前图标路径 `icon`

动画组件在这两个插槽中继续提供 `motionStyle`，其中包含本次交互的过渡时长。展示扩展应沿用该值，使点击过渡、受控同步和取消恢复保持一致。`Raised` 在内部使用这些插槽替换装饰和图文，无需复制导航或动画状态逻辑。

小程序端的循环作用域插槽应由拥有显式列表循环的组件直接提供。避免在已有循环作用域插槽内再次转发同名插槽：多层转发可能丢失逐项名称，生成多个固定名称的原生插槽，平台只接受第一个。Vue DOM 测试不能覆盖这一编译差异，需要同时检查小程序模板产物并验证运行时渲染。

## 预选与确认

`Animated` 与 `Raised` 按以下顺序处理选择：

1. 点击非活动项后预览目标，播放 260ms 过渡
2. 过渡结束后执行可选的 `beforeChange(selection, item)`，等待返回结果
3. 确认通过后发出 `change`，随后同步到调用方提供的受控值

`beforeChange` 返回 `false`、抛出异常或 Promise 拒绝时取消选择；返回 `true`、`undefined` 或对应的 Promise 结果时确认选择。等待确认期间忽略新的点击请求。

动画等待期间，连续选择以最后一次为准，点回实际当前项取消选择。确认期间 `value` 同步为本次目标时保留请求，其余 `value` 更新以及列表、字段映射或确认回调变化会使请求失效。

支持预选的组件通过 `TabbarExpose` 提供 `cancel()`。它取消待提交请求并恢复受控值；`cancel({ restore: false })` 则保留当前视觉选中项，供页面离场交接使用。组件停用、卸载时也会取消请求。已经开始的回调副作用由调用方负责，取消操作只能忽略其过期结果。

只有用户发起的预选播放过渡。初始化、受控同步和取消恢复直接就位；H5 开启减少动态效果时，同时关闭过渡与提交等待。

## 页面接入与生命周期

`AppPageTabbar` 读取 `pages.json` 中的 `tabBar.list`，以 `pagePath` 映射标签值，通过 `usePageRoute()` 绑定所属页面。导航时再调用 `usePages().getCurrentPage()` 查询真实活动路由，避免缓存页面混用其他页面的选中状态。

当前接入层通过 `beforeChange` 执行导航，导航进行中忽略重复请求；失败时恢复选中项并提示重试。页面隐藏或卸载后，正在进行的请求不再显示失败提示。

页面隐藏时取消待提交请求。自身导航进行中保留已到达的目标位置，避免旧页面尚未退场时回弹；页面再次显示时直接恢复所属选中项。H5 同 tab 导航可能只触发 `onHide`，因此该钩子用于交互清理，底栏显示仍由所属页面配置决定。

| 平台 | 原生底栏处理 | 隐藏页选中项恢复 |
| --- | --- | --- |
| H5 | 组件挂载、页面显示时调用 `hideTabBar()` | Vue 缓存组件停用时恢复，页面显示时再次同步 |
| 微信小程序 | 通过页面配置启用自定义底栏 | 支持 `onAppRouteDone` 时在转场完成后恢复，否则在页面显示时恢复 |
| 其他平台 | 组件挂载、页面显示时调用 `hideTabBar()` | 页面显示时同步 |

微信转场完成后无动画恢复隐藏页。事件目标必须与当前活动路由一致，且不是所属页面，避免迟到事件打断活动页的新预选。平台支持监听和取消监听时才注册，注册与卸载使用同一个回调，参见[微信页面路由监听](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/route-event-listener.html)。

页面内自定义底栏随页面实例切换。更换展示组件时应验证点击、导航失败、返回缓存页和平台转场交接；安全区、高度与滚动区域的职责见[页面容器与导航约定](page-layouts.md)。
