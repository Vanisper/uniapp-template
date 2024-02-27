import { URL, fileURLToPath } from "node:url"

import { defineConfig } from "vite"
import Uni from "@dcloudio/vite-plugin-uni"
import UniPages from "@uni-helper/vite-plugin-uni-pages"
import UniLayouts from "@uni-helper/vite-plugin-uni-layouts"
import UniPlatform from "@uni-helper/vite-plugin-uni-platform"
import UniMiddleware from "@uni-helper/vite-plugin-uni-middleware"
import UniPlatformModifier from "@uni-helper/vite-plugin-uni-platform-modifier"
import UniManifest from "@uni-helper/vite-plugin-uni-manifest"
import UniComponents, { kebabCase } from "@uni-helper/vite-plugin-uni-components"
import AutoImport from "unplugin-auto-import/vite"
import UnoCSS from "unocss/vite"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    // https://github.com/uni-helper/vite-plugin-uni-pages
    UniPages({
      dts: "src/uni-pages.d.ts",
      exclude: ["_*.*", "**/components/**/*.*"],
    }),
    // https://github.com/uni-helper/vite-plugin-uni-layouts
    UniLayouts(),
    // https://github.com/uni-helper/vite-plugin-uni-platform
    UniPlatform(),

    // https://github.com/uni-helper/vite-plugin-uni-middleware
    UniMiddleware(),
    // https://github.com/uni-helper/vite-plugin-uni-platform-modifier
    UniPlatformModifier(),
    // https://github.com/uni-helper/vite-plugin-uni-manifest
    UniManifest(),
    UniComponents({
      dts: "src/components.d.ts",
      directoryAsNamespace: true,
      resolvers: [
        {
          type: "component",
          resolve: (name: string) => {
            if (name.match(/^Wd[A-Z]/)) {
              const compName = kebabCase(name)
              return {
                name,
                from: `wot-design-uni/components/${compName}/${compName}.vue`,
              }
            }
          },
        },
      ],
    }),
    Uni(),
    UnoCSS(),
    // https://github.com/coderhyh/unplugin-auto-export // 暂时测试无效 原因未知
    // AutoExport({
    //     // 要监听的文件夹, 路径可以使用别名; 以 /* 结尾即可
    //     path: ["src/hooks/*", "src/components/*"],
    //     // // 要忽略的文件夹或文件（可选）
    //     // ignore: ["**/node_modules/*"],
    //     // // 文件扩展名（默认为 'ts'）'ts' | 'js'
    //     // extname: "ts",
    //     // // 自定义导出格式
    //     // formatter: (filename, extname) => `export * from './${filename}'`,
    // }),
    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        "vue",
        "@vueuse/core",
        "uni-app",
        "pinia",
        {
          from: "uni-mini-router",
          imports: ["createRouter", "useRouter", "useRoute"],
        },
      ],
      dts: "src/auto-imports.d.ts",
      dirs: ["src/composables", "src/stores", "src/utils"],
      vueTemplate: true,
    }),
  ],
  build: {
    target: "es6",
    cssTarget: "chrome61", // https://cn.vitejs.dev/config/build-options.html#build-csstarget
  },
  optimizeDeps: {
    exclude: ["vue-demi"],
  },
})
