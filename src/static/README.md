# 静态资源来源

## 图标

`tabbar/` 中的 PNG 由本地 `@iconify-json/carbon` 图标集转换，并分别设置普通态与选中态颜色。页面中的 Carbon 图标使用同一图标来源。

作者为 IBM，上游为 [Carbon Design System](https://github.com/carbon-design-system/carbon)，采用 [Apache-2.0 许可证](https://github.com/carbon-design-system/carbon/blob/main/LICENSE)。作者和许可信息可在依赖包的 `info.json` 中核对。

## 图片

`editorial/bookshop.jpg` 由内置 ImageGen 生成，内容为自然光下的独立书店阅读角，使用原木、绿植和暖米色构图。

<details>
<summary>原始生成提示词</summary>

```text
Use case: photorealistic-natural. Asset type: editorial cover photograph for a calm Chinese reading and notes mobile app. Create a landscape 3:2 photograph of a beautifully quiet independent bookshop reading corner: a warm honey oak long table in foreground, one open book and simple white coffee cup, tall bookshelves on the right, large floor-to-ceiling window framing fresh green trees on the left, soft late afternoon sunlight making crisp long rectangular shadows. Minimal tasteful real architecture, tactile paper, natural materials, slightly film-like photography, restrained forest green and warm beige palette, airy highlights. No people, no lettering, no logos, no border, no UI. The image will be shown as a wide cropped cover for a story about spending an afternoon in a bookshop. Compose a coherent real photograph with the table, shelves and window all legible at small mobile scale. Save generated image to local file.
```

</details>
