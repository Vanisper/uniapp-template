// @vitest-environment node
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getPagesOptions } from './pages'

interface GeneratedPages {
  pages: { path: string }[]
  subPackages?: { root: string, pages: { path: string }[] }[]
}

let root: string

async function addFile(path: string, content = '<template><view /></template>') {
  const file = join(root, path)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, content)
}

async function generate(expectedRoutes: string[]) {
  const options = getPagesOptions(root)
  const declarationPath = join(root, 'src/typings/uni-pages.d.ts')
  await UniPages(options).prepare({ root, platform: 'mp-weixin' })

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
