import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

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
import { defineConfig } from 'vite'
import { version, versionCode } from './package.json'

export default defineConfig(({ mode }) => {
  return {
    define: {
      __UNI_PLATFORM__: JSON.stringify(process.env.UNI_PLATFORM),
      __NODE_ENV__: JSON.stringify(mode),
      __APP_VERSION__: JSON.stringify(version),
      __APP_VERSION_CODE__: Number(versionCode),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [
      // https://uni-helper.js.org/vite-plugin-uni-components
      Components({
        dts: true,
        resolvers: [UniEchartsResolver(), ZPagingResolver()],
      }),
      // https://uni-helper.js.org/vite-plugin-uni-pages
      UniPages(),
      // https://uni-helper.js.org/vite-plugin-uni-layouts
      UniLayouts(),
      // https://uni-helper.js.org/vite-plugin-uni-manifest
      UniManifest(),
      // https://uni-helper.js.org/vite-plugin-uni-platform
      UniPlatform(),
      // https://github.com/uni-ku/root
      UniRoot(),
      // https://uni-echarts.xiaohe.ink
      UniEcharts(),
      // https://uni-helper.js.org/plugin-uni
      Uni(),
      UnoCSS(),
    ],
    optimizeDeps: {
      exclude: [
        'uni-echarts',
      ],
    },
  }
})
