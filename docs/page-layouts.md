# 页面容器与导航

页面入口声明路由与布局，布局组合导航栏、内容区和底栏，业务组件负责页面内容。主包页面位于 `src/pages`，分包把页面、组件、状态、样式和专属资源归集到 `src/packages/<包名>`，启动时按 `src/packages/*/pages` 扫描并生成分包配置。

## 页面与组件

页面入口通过 `definePage()` 声明页面元信息，可以通过 `defineOptions()` 设置 `componentPlaceholder` 等页面选项。作为组件使用的 Vue 文件默认通过 `defineOptions()` 声明 `addGlobalClass: true`、`virtualHost: true` 和 `styleIsolation: 'shared'`；页面入口不使用这些组件专用选项。

页面身份以扫描结果和 `pages.json` 注册结果为准。页面与组件复用内容时，将内容提取为独立组件，页面保留路由、布局和跨包占位声明。

## 布局选择

| 布局 | 顶部导航 | 内容区域 | 底栏 |
| --- | --- | --- | --- |
| `default` | 自定义导航时提供状态栏、标题和子页返回/首页胶囊 | 可收缩的纵向滚动区 | 按所属页面和底栏模式渲染 |
| `tabbar` | 由页面内容提供 | 由页面内容组织 | 按所属页面和底栏模式渲染 |

`navigationStyle: 'default'` 使用平台导航栏；`navigationStyle: 'custom'` 在页面内部安排导航内容。自定义导航由一个层级负责顶部占位，并为微信胶囊保留可用空间。

`THEME_CONFIG.tabbar.mode` 控制底栏模式：`default` 使用平台底栏，`custom` 在页面内接入 `AppPageTabbar`。

## 所属页面与导航

`usePageRoute()` 在组件 setup 中取得所属页面的固定路由，不含前导 `/`；没有所属页面时返回 `undefined`。标题、底栏选中项和布局尺寸都使用这一路由，缓存页保持自己的展示状态。

`usePages()` 查询页面配置并执行导航：

| 方法 | 用途 |
| --- | --- |
| `getCurrentPage()` | 即时读取页面栈顶及其配置；空栈返回 `undefined` |
| `go(path, switchTab?)` | 默认打开普通页面；第二个参数为 `true` 时切换主 tab 页 |
| `goHome()` | 前往配置中标记为 `home` 的页面 |
| `goBack(home?)` | 返回上一页；参数为 `true` 时，在栈不足或返回失败后前往首页 |

主 tab 页通过 `definePage({ tabBar: ... })` 加入底栏列表，使用 `switchTab` 导航；普通子页使用 `navigateTo`，可携带查询参数。默认布局的返回按钮调用 `goBack(true)`。

导航方法返回 `Promise<boolean>`，表示导航 API 的成功或失败。目标页显示后才能执行的操作应放在页面生命周期中；等待异步子组件的公开接口可用 `useExposeReceiver`。`getCurrentPage()` 是即时查询，不是响应式状态来源。

## 分包归属

主 tab 页保留主包入口，业务视图、子页、状态、样式和资源放在所属分包。主包入口静态导入分包视图，并声明小程序异步占位：

```vue
<script setup lang="ts">
import DiscoveryView from '@/packages/journal/components/DiscoveryView.vue'

defineOptions({ componentPlaceholder: { DiscoveryView: 'view' } })

definePage({
  layout: 'tabbar',
  style: { navigationStyle: 'custom' },
})
</script>

<template>
  <DiscoveryView />
</template>
```

实际主 tab 声明还包括文字、顺序和图标，见 [主包入口](../src/pages/index.vue)。小程序异步加载由 `componentPlaceholder` 与分包优化插件处理，Vue 文件继续使用静态导入。

包内依赖显式导入，共享状态的消费者引用同一模块。主包入口通过组件接口使用业务能力；普通分包可以复用主包公共模块，独立分包则需要单独安排初始化和依赖。源码目录表达职责，最终产物归属由依赖图决定。

包内图片使用模块导入，交由构建工具生成平台路径；公共底栏图标放在主包 `static/`。分包样式由实际使用的页面或组件显式引入，应用级样式集中在 `src/styles/base.scss`。

## 高度、安全区与滚动

`PageWrapper` 提供可用视口和纵向弹性容器，`useLayout()` 根据所属页面配置返回尺寸，单位均为 px。

| 区域 | 处理方式 |
| --- | --- |
| 原生导航 | 使用平台窗口偏移 |
| 自定义导航 | 状态栏与导航栏在容器内部占位 |
| 原生底栏 | 使用已由平台预留底栏和安全区的视口 |
| 自定义底栏或普通页 | 容器预留底部安全区 |
| H5 | 使用框架窗口偏移，其中已包含安全区；优先 `100dvh`，回退 `100vh` |

容器提供 `--status-bar-height`、`--navbar-height` 和 `--tabbar-height`。底栏变量表示完整视觉高度，不包含底部安全区；原生底栏页和普通页的该值为零。浮起底栏的实际占位为完整高度减去向内容区覆盖的装饰量。

`useLayout().pageHeight` 扣除状态栏、导航栏和完整底栏高度，适合按保守内容高度估算布局。精确滚动尺寸以实际容器为准。

页面内容使用 `flex: 1`、`min-height: 0` 分配剩余空间，并确定一个主要滚动区域。`scroll-view` 的高度由容器约束，导航栏和底栏保持稳定占位。

## 样式范围

应用级颜色变量和元素重置由 `App.vue` 引入。组件的 `scoped` 样式作用于自身模板；多个组件使用同一组样式时，各自显式引入。

小程序组件样式使用类选择器。全局元素重置保留在应用样式中，例如 `page button` 和 `page button::after`；组件使用类名继续覆盖。覆盖框架默认样式时，应让选择器范围和优先级表达意图，以适应 H5 开发服务与构建产物不同的 CSS 加载顺序。
