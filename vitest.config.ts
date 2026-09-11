import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
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
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'plugins/**/*.test.ts'],
  },
})
