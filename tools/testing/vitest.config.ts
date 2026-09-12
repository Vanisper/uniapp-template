import type { Plugin } from 'vite'
import { createRequire } from 'node:module'
import { fileURLToPath, URL } from 'node:url'
import { initScopedPreContext } from '@dcloudio/uni-cli-shared/dist/preprocess/context.js'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'

type UniPlatform = 'h5' | 'mp-weixin'

const { preprocess } = createRequire(import.meta.url)('@dcloudio/uni-cli-shared/lib/preprocess') as {
  preprocess: (code: string, context: Record<string, unknown>, options: { type: 'js' | 'html' }) => string
}

function uniConditionalCompilation(platform: UniPlatform): Plugin {
  // 使用独立上下文，避免并行项目共享 DCloud 的全局平台状态
  const { preVueContext } = initScopedPreContext(platform)

  return {
    name: `test:uni-conditional-compilation:${platform}`,
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('/node_modules/') || !/\.(?:[cm]?[jt]sx?|vue)$/.test(id) || !code.includes('#if')) {
        return
      }

      const source = id.endsWith('.vue')
        ? preprocess(code, preVueContext, { type: 'html' })
        : code
      return { code: preprocess(source, preVueContext, { type: 'js' }), map: null }
    },
  }
}

function platformProject(platform: UniPlatform, include: string[]) {
  return {
    extends: true as const,
    cacheDir: fileURLToPath(new URL(`./node_modules/.vite/${platform}`, import.meta.url)),
    plugins: [
      uniConditionalCompilation(platform),
      vue(),
      AutoImport({
        dts: false,
        imports: ['vue', 'pinia'],
        // 当前 Vue 3.4 不提供这些预设 API
        ignore: ['getCurrentWatcher', 'onWatcherCleanup', 'useId', 'useTemplateRef'],
      }),
    ],
    test: {
      name: platform,
      include,
      provide: { uniPlatform: platform },
    },
  }
}

export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  cacheDir: fileURLToPath(new URL('./node_modules/.vite', import.meta.url)),
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
    projects: [
      platformProject('h5', ['src/**/*.test.ts', 'plugins/**/*.test.ts']),
      platformProject('mp-weixin', [
        'src/components/App/PageTabbar.test.ts',
        'src/components/Tabbar/**/*.test.ts',
      ]),
    ],
    server: {
      deps: {
        // 该生成文件含注释，由测试 mock 接管，避免 Vite 先按 JSON 解析
        external: [/[/\\]src[/\\]pages\.json$/],
      },
    },
  },
})
