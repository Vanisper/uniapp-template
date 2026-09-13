# 主包静态资源来源

`tabbar/` 中的 PNG 由本地 `@iconify-json/carbon` 图标集转换，并分别设置普通态与选中态颜色。公共底栏图标保留在主包，页面中的 Carbon 图标使用同一图标来源。

作者为 IBM，上游为 [Carbon Design System](https://github.com/carbon-design-system/carbon)，采用 [Apache-2.0 许可证](https://github.com/carbon-design-system/carbon/blob/main/LICENSE)。作者和许可信息可在依赖包的 `info.json` 中核对。

分包图片与原始生成提示词见[分包静态资源说明](../packages/journal/static/README.md)。
