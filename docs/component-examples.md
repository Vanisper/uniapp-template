# 组件接入与场景示例

从「我的 → 测试中心 → 组件体验」进入。示例归属于 `src/packages/demo` 分包，页面只负责路由和视图组合；导航栏与可用高度由默认布局提供。

## Wot UI

项目使用 Wot UI v2，npm 包为 `@wot-ui/ui`，当前锁定版本为 2.3.2。接入参考[官方快速上手](https://wot-ui.cn/guide/quick-use.html)。

- `plugins/vite/components.ts` 注册 `WotV2Resolver()`，按需引入 `wd-*` 组件
- `tsconfig.app.json`、`tsconfig.test.json` 加载 `@wot-ui/ui/global`，提供组件属性和事件类型
- 项目已有 Sass，无需另外引入一份全量组件样式

不要使用面向 v1 `wot-design-uni` 包的 `WotResolver()`。当前 uni-helper 已内置 v2 解析器，不需要再维护一份 easycom 规则。

组件插件只为本地组件生成 `components.d.ts`；Wot UI、z-paging 和 uni-echarts 使用各自的官方全局类型，运行时仍按需导入，避免自动生成的第三方声明造成重复提示和错误的命名导出。

在页面模板中直接使用组件：

```vue
<template>
  <wd-button>保存</wd-button>
</template>
```

Wot 示例位于 `/packages/demo/pages/wot`，包括表单校验、保存结果、Toast 提示和 Dialog 确认。它只维护本页演示状态，不提交到后端。

主题通过示例内的 `wd-config-provider` 设置，使用 v2 的 `primary1`、`primary2`、`primary6` 等变量。项目原有主题存储中的 `colorTheme` 属于旧版命名，不能直接作为 v2 的主色配置使用。其他业务页可按需要接入自己的 ConfigProvider。

Toast、Dialog 这类反馈组件需要在使用它们的组件模板中放置对应节点，不能只调用 composable 而省略模板节点。

## z-paging

现有依赖和 `ZPagingResolver()` 继续使用，场景数据来自本地模拟，带有短暂延迟，无需配置接口。

| 页面 | 体验内容 | 验证方式 |
| --- | --- | --- |
| `/packages/demo/pages/paging-basic` | 基础分页 | 下拉刷新、滚动到底加载下一页，直到出现没有更多 |
| `/packages/demo/pages/paging-filter` | 搜索与分类 | 输入关键词、切换分类，观察列表从第一页重新开始；搜索无匹配内容查看空态 |
| `/packages/demo/pages/paging-states` | 空态与失败重试 | 切换空列表、首屏失败、加载更多失败，重试后恢复正常数据 |

分页接入遵循[官方数据处理约定](https://z-paging.com/api/methods/main)：

- 由 `@query` 接收页码和每页条数，成功调用 `complete(list)`，失败调用 `complete(false)`
- `v-model` 列表由 z-paging 维护，不手动拼接请求结果
- 刷新通过 `reload()` 触发，不直接调用查询处理函数
- 搜索或场景变化时隔离旧请求，卸载后取消未完成的模拟请求

默认布局已经占用导航栏高度，示例设置 `:fixed="false"`，在剩余高度内使用 z-paging 的内部滚动。顶部说明、筛选与加载状态通过外层 flex 布局固定，列表独立滚动，不再叠加固定导航或页面滚动。安全区沿用页面容器，避免重复留白，详见[页面容器与导航约定](page-layouts.md)。

接入真实接口时替换本地数据源，保留分页结束通知、错误处理和过期请求隔离。数据总量未知时，默认以返回条数少于 `pageSize` 判断结束；接口返回总数时也可以使用 z-paging 的 `completeByTotal`。

## 内置导航胶囊

默认布局的返回与首页胶囊采用无阴影、细描边的样式，双按钮之间使用居中的短分隔线。仅显示一个按钮时默认宽度收紧，显式 `width` 仍可覆盖；`shadow` 保留为可选参数。按钮提供按压反馈，禁用时不触发导航事件。

## 验证

```sh
pnpm type-check
pnpm lint
pnpm test
pnpm build
pnpm build mp-weixin
```

H5 可通过测试中心逐项操作。微信构建后需要继续在开发者工具或真机确认胶囊避让、下拉手势、键盘和安全区表现；编译通过不代表这些设备行为已验证。
