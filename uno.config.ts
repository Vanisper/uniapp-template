import {
  defineConfig,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from "unocss"

import presetWeapp from "unocss-preset-weapp"
import { extractorAttributify, transformerClass } from "unocss-preset-weapp/transformer"

const { presetWeappAttributify, transformerAttributify } = extractorAttributify()

export default defineConfig({
  presets: [
    // https://github.com/MellowCo/unocss-preset-weapp
    presetWeapp(),
    // attributify autocomplete
    presetWeappAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        "display": "inline-block",
        "vertical-align": "middle",
      },
    }),
  ],
  transformers: [
    // https://github.com/MellowCo/unocss-preset-weapp/tree/main/src/transformer/transformerAttributify
    transformerAttributify(),
    // https://github.com/MellowCo/unocss-preset-weapp/tree/main/src/transformer/transformerClass
    transformerClass(),

    transformerDirectives(),
    transformerVariantGroup(),
  ],
})
