# TabBar 接入与组件契约

TabBar 组件负责展示和选择交互，`AppPageTabbar` 绑定所属页面并执行导航。组件的 `value` 由调用方控制，动画预选由组件内部管理。

## 模式与高度

在 [主题配置](../src/configs/theme.ts) 中设置底栏：

| 配置 | 含义 |
| --- | --- |
| `tabbar.mode: 'default'` | 使用平台底栏 |
| `tabbar.mode: 'custom'` | 使用页面内的 `AppPageTabbar` |
| `tabbar.height` | 自定义底栏的完整视觉高度，单位 px，不含底部安全区；当前为 72 |

[pages.config.ts](../pages.config.ts) 读取同一配置，按 `UNI_PLATFORM` 生成微信/抖音的 `custom`、支付宝的 `customize` 与 `overlay`。配置文件运行在 Node 中，平台字段通过代码筛选。切换模式后重新启动开发服务或构建。

底部安全区由 `PageWrapper` 预留，接入层补齐背景。浮起底栏的装饰覆盖内容区边缘，实际占位为完整高度减去覆盖量；滚动内容应留出尾部空间，使最后一项能完整移出覆盖区。

## 选择组件

[AppPageTabbar](../src/components/App/PageTabbar.vue) 通过显式导入选择展示组件，当前使用 `Raised`。

| 组件 | 导入路径 | 交互 |
| --- | --- | --- |
| 基础 `Tabbar` | `@/components/Tabbar/index.vue` | 点击后立即发出 `change` |
| `Animated` | `@/components/Tabbar/Animated/index.vue` | 预选动画、`beforeChange` 确认与 `cancel()` |
| `Raised` | `@/components/Tabbar/Raised/index.vue` | 在动画组件上提供凹槽和抬升图文，沿用确认与取消接口 |

`Raised` 与 `Animated` 可直接更换导入路径。改用基础组件时，通过 `@change` 执行导航，并移除 `beforeChange`、预选 ref 和取消控制。每次选择使用一个导航触发点。

## 参数与事件

三个组件共用 [TabbarProps](../src/components/Tabbar/type.ts)：

| 参数 | 约定 |
| --- | --- |
| `list` | 标签列表，值字段唯一且稳定 |
| `value` | 字符串按值字段匹配，整数表示索引 |
| `valueField` | 默认 `value` |
| `textField` | 默认 `text` |
| `iconField` | 默认 `iconPath` |
| `activeIconField` | 默认 `selectedIconPath` |
| `height` | 必填，单位 px |
| `color`、`activeColor` | 普通态与选中态文字颜色，默认 `#bfbfbf`、`#0165ff` |

未传或无效的 `value` 选中首项；空列表的选中索引为 `-1`。`change(selection, item)` 的 `selection` 包含映射后的 `value` 和 `text`，`item` 为原始列表项。调用方更新 `value` 确认最终选中项。

选中图标缺省时沿用普通图标；两者均缺省时只显示文字。`static/` 开头的图标路径转换为 `/static/`，其余路径保持原样。

UnoCSS 属性模式下，颜色参数通过脚本变量绑定，例如 `:color="colors.normal"`、`:active-color="colors.active"`，以保留组件参数并避免生成属性选择器。

## 动画与确认

`Animated` 和 `Raised` 的选择流程为：

1. 点击目标项，播放 260ms 预选过渡
2. 调用 `beforeChange(selection, item)` 并等待结果
3. 确认后发出 `change`，再同步调用方的受控值

`beforeChange` 返回 `false` 或抛错时取消选择；返回 `true`、`undefined` 或对应的 Promise 结果时确认。等待确认期间忽略新点击。动画阶段连续点击以最后一次为准，点回实际当前项则取消预选。

确认期间，`value` 更新为本次目标可完成确认；其他 `value` 更新，以及列表、值/文字字段映射或确认回调的变化，会使待处理请求失效。失效结果不再更新界面，回调已发出的导航或请求由调用方管理。

`TabbarExpose.cancel()` 取消待提交选择并恢复受控值；`cancel({ restore: false })` 保留视觉选中项，用于页面离场交接。组件停用或卸载时自动取消。初始化、受控同步和取消恢复直接就位；H5 的减少动态效果设置会同时关闭动画和提交等待。

## 插槽扩展

基础组件与动画组件提供以下插槽：

| 插槽 | 参数 |
| --- | --- |
| `indicator` | 当前索引 `index`、标签数量 `count` |
| `item` | 原始项 `item`、索引、活动状态，以及映射后的 `value`、`text`、`icon` |

动画组件额外提供 `motionStyle`，扩展内容沿用它控制过渡时长。`Raised` 使用这些插槽绘制凹槽和抬升图文，交互仍由动画组件处理。

小程序的循环作用域插槽由拥有列表循环的组件直接提供；多层转发同名循环插槽可能产生重复原生插槽名。插槽中绝对定位的内容使用明确高度，因为编译器可能插入自动高度的中间容器。装饰层保持点击穿透，点击由标签命中区统一处理。

## 页面接入

`AppPageTabbar` 读取 `pages.json` 的 `tabBar.list`，以 `pagePath` 为值字段，使用 `usePageRoute()` 绑定所属页面。导航时即时读取 `getCurrentPage()`，通过 `go(value, true)` 切换 tab。

导航期间忽略重复请求；失败时恢复选择并提示重试。页面隐藏或卸载后，旧请求不再显示失败提示。页面隐藏时取消预选，自身导航进行中保留目标位置；再次显示时同步所属页面的受控值。

| 平台 | 原生底栏处理 | 缓存页恢复 |
| --- | --- | --- |
| H5 | 挂载和页面显示时调用 `hideTabBar()` | Vue 组件停用和页面再次显示时恢复 |
| 微信小程序 | 页面配置启用自定义底栏 | 支持路由完成监听时在转场结束后恢复隐藏页，页面显示时再次同步 |
| 其他平台 | 挂载和页面显示时调用 `hideTabBar()` | 页面显示时同步 |

微信路由完成事件同时匹配当前活动路由和所属页面，避免迟到事件影响当前预选；监听随组件卸载释放。相关平台接口见 [微信页面路由监听](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/route-event-listener.html)。

主 tab 入口与图标位于主包，页面业务视图可以归属分包。更换底栏组件或表面颜色时，同步检查导航失败、缓存页返回、平台转场和安全区背景。
