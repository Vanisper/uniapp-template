import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import { version, versionCode } from './package.json'

import createPlugins from './plugins/vite'

export default defineConfig(async ({ mode, command }) => {
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
    plugins: await createPlugins(mode, command === 'build'),
    optimizeDeps: {
      exclude: [
        'uni-echarts',
      ],
    },
  }
})
