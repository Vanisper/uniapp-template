// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseWindowOptions } from '@dcloudio/uni-cli-shared/dist/json/mp/utils.js'
import { normalizePagesJson } from '@dcloudio/uni-cli-shared/dist/json/pages.js'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPagesOptions } from './pages'

interface GeneratedPages {
  pages: { path: string }[]
  subPackages?: { root: string, pages: { path: string }[] }[]
  globalStyle?: Record<string, unknown>
  tabBar?: Record<string, unknown>
}

let root: string

async function addFile(path: string, content = '<template><view /></template>') {
  const file = join(root, path)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, content)
}

async function generate(expectedRoutes: string[], platform = 'mp-weixin') {
  const options = getPagesOptions(root)
  const declarationPath = join(root, 'src/typings/uni-pages.d.ts')
  await UniPages(options).prepare({ root, platform })

  const declaration = await readFile(declarationPath, 'utf8')
  expect(Array.from(declaration.matchAll(/"(\/[^"\n]+)"/g), match => match[1]).sort())
    .toEqual(expectedRoutes.toSorted())

  const pages = await readFile(join(root, 'src/pages.json'), 'utf8')
  return JSON.parse(pages.replace(/^\s*\/\/.*$/gm, '')) as GeneratedPages
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uni-pages-packages-'))
  vi.stubEnv('VITE_ROOT_DIR', root)
  await addFile('src/pages/index.vue')
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await rm(root, { recursive: true, force: true })
})

describe('页面配置的平台边界', () => {
  beforeEach(async () => {
    await symlink(fileURLToPath(new URL('../../node_modules', import.meta.url)), join(root, 'node_modules'), 'dir')
    await addFile('pages.config.ts', await readFile(new URL('../../pages.config.ts', import.meta.url), 'utf8'))
    await addFile('src/configs/theme.ts', 'export const THEME_CONFIG = { tabbar: { mode: "custom" } }')
    await addFile('src/pages/index.vue', '<script setup>definePage({ tabBar: { text: "首页", index: 0 } })</script><template><view /></template>')
    await addFile('src/pages/profile.vue', '<script setup>definePage({ tabBar: { text: "我的", index: 1 } })</script><template><view /></template>')
  })

  it.each([
    { platform: 'mp-weixin', custom: true, alipay: false },
    { platform: 'mp-toutiao', custom: true, alipay: false },
    { platform: 'mp-alipay', custom: false, alipay: true },
    { platform: 'h5', custom: false, alipay: false },
    { platform: 'app', custom: false, alipay: false },
    { platform: 'app-plus', custom: false, alipay: false },
    { platform: 'app-harmony', custom: false, alipay: false },
  ])('$platform 仅生成受支持的平台设置', async ({ platform, custom, alipay }) => {
    vi.stubEnv('UNI_PLATFORM', platform)

    const pages = await generate(['/pages/index', '/pages/profile'], platform)

    expect(pages.tabBar?.custom).toBe(custom ? true : undefined)
    expect(pages.tabBar?.customize).toBe(alipay ? true : undefined)
    expect(pages.tabBar?.overlay).toBe(alipay ? true : undefined)
    expect(pages.globalStyle).not.toHaveProperty('animationType')
    expect(pages.globalStyle).not.toHaveProperty('animationDuration')
  })

  it.each(['mp-weixin', 'mp-alipay'])('%s 原生模式不生成自定义底栏设置', async (platform) => {
    vi.stubEnv('UNI_PLATFORM', platform)
    await addFile('src/configs/theme.ts', 'export const THEME_CONFIG = { tabbar: { mode: "default" } }')

    const pages = await generate(['/pages/index', '/pages/profile'], platform)

    expect(pages.tabBar).toHaveProperty('list')
    for (const field of ['custom', 'customize', 'overlay', 'height']) {
      expect(pages.tabBar).not.toHaveProperty(field)
    }
  })

  it('共享配置交给各端编译器后保留 App 动画且不污染小程序窗口', async () => {
    vi.stubEnv('UNI_PLATFORM', 'mp-weixin')
    vi.stubEnv('UNI_INPUT_DIR', join(root, 'src'))
    await addFile('src/manifest.json', '{}')
    const pages = await generate(['/pages/index', '/pages/profile'])

    for (const platform of ['app', 'app-harmony'] as const) {
      const normalized = normalizePagesJson(JSON.stringify(pages), platform)
      expect(normalized.globalStyle).toMatchObject({ animationType: 'pop-in', animationDuration: 300 })
      expect(normalized.globalStyle).not.toHaveProperty('app-plus')
      expect(normalized.globalStyle).not.toHaveProperty('app-harmony')
    }

    for (const platform of ['mp-weixin', 'mp-alipay'] as const) {
      const windowOptions = parseWindowOptions(structuredClone(pages.globalStyle ?? {}), platform)
      for (const field of ['animationType', 'animationDuration', 'app-plus', 'app-harmony']) {
        expect(windowOptions).not.toHaveProperty(field)
      }
    }
  })
})

describe('分包目录约定', () => {
  it('缺少分包目录时仅生成主包，分包按非隐藏的直属目录名称排序', async () => {
    expect((await generate(['/pages/index'])).subPackages ?? []).toEqual([])

    await addFile('src/packages/zeta/pages/index.vue')
    await addFile('src/packages/alpha/pages/index.vue')
    await addFile('src/packages/empty/components/Card.vue')
    await addFile('src/packages/.hidden/pages/index.vue')
    await addFile('src/packages/readme.md', '# packages')

    const pages = await generate([
      '/pages/index',
      '/packages/alpha/pages/index',
      '/packages/zeta/pages/index',
    ])
    expect(pages.subPackages?.map(packageConfig => packageConfig.root))
      .toEqual(['packages/alpha', 'packages/zeta'])
  })

  it('只注册包内 pages 页面并保留路径层级，组件和嵌套包不成为页面', async () => {
    await addFile('src/packages/demo/pages/index.vue')
    await addFile('src/packages/demo/pages/detail/index.vue')
    await addFile('src/packages/demo/components/Card.vue')
    await addFile('src/packages/demo/pages/components/LocalCard.vue')
    await addFile('src/packages/demo/pages/_draft.vue')
    await addFile('src/packages/demo/nested/pages/index.vue')
    await addFile('src/packages/.hidden/pages/index.vue')

    const pages = await generate([
      '/pages/index',
      '/packages/demo/pages/index',
      '/packages/demo/pages/detail/index',
    ])

    expect(pages.pages).toMatchObject([{ path: 'pages/index' }])
    expect(pages.subPackages).toMatchObject([{
      root: 'packages/demo',
      pages: [{ path: 'pages/detail/index' }, { path: 'pages/index' }],
    }])
  })

  it('重新发现后生成新增分包，删除分包时清理配置和路由声明', async () => {
    await addFile('src/packages/alpha/pages/index.vue')
    await generate(['/pages/index', '/packages/alpha/pages/index'])

    await addFile('src/packages/zeta/pages/detail.vue')
    const added = await generate([
      '/pages/index',
      '/packages/alpha/pages/index',
      '/packages/zeta/pages/detail',
    ])
    expect(added.subPackages?.map(packageConfig => packageConfig.root)).toEqual([
      'packages/alpha',
      'packages/zeta',
    ])

    await rm(join(root, 'src/packages/alpha'), { recursive: true })
    const removed = await generate(['/pages/index', '/packages/zeta/pages/detail'])
    expect(removed.subPackages).toMatchObject([{
      root: 'packages/zeta',
      pages: [{ path: 'pages/detail' }],
    }])

    await rm(join(root, 'src/packages/zeta'), { recursive: true })
    const empty = await generate(['/pages/index'])
    expect(empty.subPackages ?? []).toEqual([])
  })
})
