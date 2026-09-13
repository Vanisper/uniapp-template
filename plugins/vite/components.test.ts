// @vitest-environment node
import { EventEmitter } from 'node:events'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createComponentPlugins } from './components'

let root: string

async function addFile(path: string, content: string) {
  const file = join(root, path)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, content)
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'uni-components-types-'))
  await addFile('src/components/Navbar/index.vue', '<template><view /></template>')
  await addFile('src/typings/components.d.ts', `export {}
declare module 'vue' {
  export interface GlobalComponents {
    WdButton: typeof import('@wot-ui/ui/components/wd-button/wd-button.vue')['WdButton']
    ZPaging: typeof import('z-paging/components/z-paging/z-paging.vue')['ZPaging']
    RemovedLocal: typeof import('./removed.vue')['default']
  }
}
`)
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('组件声明与运行时导入', () => {
  it.each(['serve', 'build'] as const)('%s 只生成本地组件声明，并保留所有组件的按需导入', async (command) => {
    const plugins = createComponentPlugins()
    const watcher = new EventEmitter()
    for (const plugin of plugins) {
      if (typeof plugin.configResolved === 'function')
        await plugin.configResolved({ root, command, build: { watch: false } } as never)
      if (command === 'serve' && typeof plugin.configureServer === 'function')
        await plugin.configureServer({ watcher } as never)
    }

    let code = `
const navbar = _resolveComponent("Navbar")
const provider = _resolveComponent("wd-config-provider")
const button = _resolveComponent("wd-button")
const paging = _resolveComponent("z-paging")
const chart = _resolveComponent("uni-echarts")
`
    for (const plugin of plugins) {
      if (typeof plugin.transform !== 'function')
        continue

      const context = {
        error(error: unknown) {
          throw error
        },
      }
      const transformed = await plugin.transform.call(context as never, code, join(root, 'src/pages/example.vue'))
      code = typeof transformed === 'string' ? transformed : transformed?.code ?? code
    }

    const importNames = Array.from(code.matchAll(/import\s+(?:\{[^}]*\bas\s+)?(__unplugin_components_\d+)/g), match => match[1])
    expect(importNames).toHaveLength(5)
    expect(new Set(importNames).size).toBe(5)
    expect(code).not.toContain('_resolveComponent(')
    expect(code).toContain('@wot-ui/ui/components/wd-config-provider/wd-config-provider.vue')
    expect(code).toContain('z-paging/components/z-paging/z-paging.vue')
    expect(code).toContain('uni-echarts')

    await expect.poll(async () => readFile(join(root, 'src/typings/components.d.ts'), 'utf8'))
      .toMatch(/Navbar: typeof import\('.+Navbar\/index\.vue'\)\['default'\]/)
    const declaration = await readFile(join(root, 'src/typings/components.d.ts'), 'utf8')
    expect(declaration).not.toMatch(/\b(?:Wd\w+|ZPaging|UniEcharts|RemovedLocal):/)
  })
})
