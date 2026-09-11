import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  cacheDir: fileURLToPath(new URL('./node_modules/.vite', import.meta.url)),
  plugins: [
    vue(),
    AutoImport({
      dts: false,
      imports: ['vue', 'pinia'],
      // 当前 Vue 3.4 不提供这些预设 API
      ignore: ['getCurrentWatcher', 'onWatcherCleanup', 'useId', 'useTemplateRef'],
    }),
  ],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('../../src', import.meta.url)),
      },
      {
        find: /^vitest$/,
        // 源码测试位于工作区外，固定到当前测试运行器
        replacement: fileURLToPath(import.meta.resolve('vitest')),
      },
    ],
  },
  test: {
    clearMocks: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'plugins/**/*.test.ts'],
    server: {
      deps: {
        // 该生成文件含注释，由测试 mock 接管，避免 Vite 先按 JSON 解析
        external: [/[/\\]src[/\\]pages\.json$/],
      },
    },
  },
})
