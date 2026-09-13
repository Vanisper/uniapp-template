# 项目约定

## uni-app 组件与页面

封装组件默认在 `<script setup>` 中声明以下小程序组件选项，使全局样式、宿主节点和样式隔离策略保持一致：

```ts
defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})
```

- 此约定适用于作为组件使用的 Vue 文件，包括公共组件和分包内的业务视图组件。如果组件确实需要保留宿主节点或隔离样式，应按其实际职责配置，并说明原因。
- 被页面扫描器收录、最终注册到 `pages.json` 的 Vue 文件属于页面入口，不要套用上述组件专用选项，否则可能在小程序端编译报错。页面配置通过 `definePage()` 声明。
- 页面仍可按需使用 `defineOptions()` 配置 `componentPlaceholder` 等页面适用选项；限制针对上述组件专用选项，不是禁止页面使用 `defineOptions()`。
- 同一份视图需要用于页面和组件时，保留薄页面入口，把实际内容拆为独立组件。组件改为页面或调整扫描目录时，重新检查文件角色与选项。
- 开启共享样式后，组件内仍使用类选择器并控制样式作用范围，不能依赖标签、ID 或属性选择器绕过小程序组件样式限制。

页面扫描、布局和分包职责见 [页面容器与导航约定](docs/page-layouts.md)。
