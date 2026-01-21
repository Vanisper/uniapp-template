/* eslint-disable unused-imports/no-unused-vars */
import type { PluginOption } from 'vite'

import Uni from '@uni-helper/plugin-uni'
import Components from '@uni-helper/vite-plugin-uni-components'
import { ZPagingResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
import UniManifest from '@uni-helper/vite-plugin-uni-manifest'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import UniPlatform from '@uni-helper/vite-plugin-uni-platform'
import UniRoot from '@uni-ku/root'
import { UniEchartsResolver } from 'uni-echarts/resolver'
import { UniEcharts } from 'uni-echarts/vite'
import UnoCSS from 'unocss/vite'

export default async function createPlugins(mode: string, isBuild = false) {
  const Plugins: (PluginOption | PluginOption[])[] = [
    // https://uni-helper.js.org/vite-plugin-uni-components
    Components({
      dts: 'src/typings/components.d.ts',
      directoryAsNamespace: true,
      resolvers: [UniEchartsResolver(), ZPagingResolver()],
    }),
    // https://github.com/uni-helper/vite-plugin-uni-pages
    UniPages({
      dts: 'src/typings/uni-pages.d.ts',
      exclude: ['_*.*', '**/components/**/*.*', '**/_components/**/*.*'],
    }),
    // https://github.com/uni-helper/vite-plugin-uni-layouts
    UniLayouts(),
    // https://github.com/uni-helper/vite-plugin-uni-manifest
    UniManifest(),
    // https://uni-helper.js.org/vite-plugin-uni-platform
    UniPlatform(),
    // https://github.com/uni-ku/root
    UniRoot(),
    // https://uni-echarts.xiaohe.ink
    UniEcharts(),
    // uniapp esm: https://github.com/dcloudio/uni-app/issues/4815#issuecomment-3076701285
    Uni({
      vueOptions: {
        script: {
          // https://juejin.cn/post/7490752699617869836
          // https://github.com/vuejs/core/issues/8612#issuecomment-1600030885
          // https://www.cnblogs.com/dingshaohua/p/18735864
          // import { globSync } from "tinyglobby"
          // globalTypeFiles: globSync('src/uni_modules/x-ui/components/**/*.d.ts', { ignore: 'node_modules/**' }),
        },
      },
    }),
    UnoCSS(),
    // // https://github.com/antfu/unplugin-auto-import
    // AutoImport({
    //   imports: [
    //     'vue',
    //     '@vueuse/core',
    //     'uni-app',
    //     'pinia',
    //     {
    //       from: 'uni-mini-router',
    //       imports: ['createRouter', 'useRouter', 'useRoute'],
    //     },
    //   ],
    //   dts: 'src/typings/auto-imports.d.ts',
    //   dirs: ['src/composables', 'src/stores', 'src/utils'],
    //   vueTemplate: true,
    // }),
  ]

  return Plugins
}
