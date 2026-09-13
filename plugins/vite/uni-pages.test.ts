// @vitest-environment node

import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

type Platform = 'h5' | 'mp-weixin'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function page(metadata: Record<string, unknown> = {}) {
  return `<script setup>definePage(${JSON.stringify(metadata)})</script><template><view /></template>`
}

function runScenario(scenario: string, platform: Platform = 'h5', { seedSubPackage = true }: { seedSubPackage?: boolean } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'uni-pages-plugin-'))

  try {
    const files: Record<string, string> = {
      'pages.config.mjs': `export default {
        pages: [],
        globalStyle: { navigationBarTitleText: '共享配置' },
        tabBar: { color: '#999999', selectedColor: '#000000' },
      }`,
      'src/pages/index.vue': page({ tabBar: { text: '首页', index: -1 } }),
      'src/pages/profile.h5.vue': page({ tabBar: { text: '网页', index: 1 } }),
      'src/pages/profile.mp-weixin.vue': page({ tabBar: { text: '微信', index: 1 } }),
      'src/packages/demo/pages/detail.h5.vue': page({ style: { navigationBarTitleText: '网页详情' } }),
      'src/packages/demo/pages/detail.mp-weixin.vue': page({ style: { navigationBarTitleText: '微信详情' } }),
      'src/packages/demo/pages/ignored.vue': page(),
    }

    for (const [path, content] of Object.entries(files)) {
      if (!seedSubPackage && path.startsWith('src/packages/'))
        continue
      const destination = join(root, path)
      mkdirSync(dirname(destination), { recursive: true })
      writeFileSync(destination, content)
    }

    // uni-env 在模块导入时读取平台，使用独立进程隔离真实库的运行环境
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict'
      import { once } from 'node:events'
      import { mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
      import { createRequire } from 'node:module'
      import { dirname, join } from 'node:path'
      import { setTimeout as delay } from 'node:timers/promises'
      import { pathToFileURL } from 'node:url'
      import UniPages from '@uni-helper/vite-plugin-uni-pages'

      const root = process.env.UNI_PAGES_TEST_ROOT
      const platform = process.env.UNI_PLATFORM
      const pagesPath = join(root, 'src/pages.json')
      const dtsPath = join(root, 'src/routes.d.ts')
      const baseOptions = {
        dir: 'src/pages',
        subPackages: [{ dir: 'src/packages/demo/pages', root: 'packages/demo' }],
        exclude: ['**/ignored.vue', '**/components/**', '**/_components/**', '**/_*.vue', '**/.*/**'],
        dts: dtsPath,
      }
      const environment = { root, platform }
      const rootForPackage = matchedDir => matchedDir.slice(4, -'/pages'.length)
      const globPackages = { dir: 'src/packages/*/pages', root: rootForPackage }
      const readPages = () => JSON.parse(readFileSync(pagesPath, 'utf8').split('\\n')
        .filter(line => !line.trimStart().startsWith('//')).join('\\n'))
      const readDeclaration = () => readFileSync(dtsPath, 'utf8')
      const routes = () => {
        const output = readPages()
        return [
          ...output.pages.map(page => '/' + page.path),
          ...(output.subPackages ?? []).flatMap(pkg => pkg.pages.map(page => '/' + pkg.root + '/' + page.path)),
        ].sort()
      }
      const declarationRoutes = () => [...new Set(Array.from(readDeclaration().matchAll(/"(\\/[^"\\n]+)"/g), match => match[1]))].sort()
      function addFile(path, content = '<template><view /></template>') {
        const destination = join(root, path)
        mkdirSync(dirname(destination), { recursive: true })
        writeFileSync(destination, content)
      }
      async function callHook(plugin, name, ...args) {
        const hook = plugin[name]
        if (hook) return (typeof hook === 'function' ? hook : hook.handler).call({}, ...args)
      }
      async function configure(plugin, { configRoot = root, withPlatformPlugin = false, watch = false, command = 'build' } = {}) {
        await callHook(plugin, 'configResolved', {
          root: configRoot,
          command,
          build: { watch: watch ? {} : false },
          plugins: withPlatformPlugin ? [{ name: 'vite-plugin-uni-platform' }] : [],
        })
      }
      async function dispose(plugin) {
        await callHook(plugin, 'closeWatcher')
        await callHook(plugin, 'closeBundle')
      }
      async function waitRoutes(expected) {
        const target = JSON.stringify(expected.toSorted())
        const deadline = Date.now() + 5_000
        while (Date.now() < deadline) {
          if (JSON.stringify(routes()) === target && JSON.stringify(declarationRoutes()) === target) return
          await delay(20)
        }
        assert.deepEqual(routes(), expected.toSorted())
        assert.deepEqual(declarationRoutes(), expected.toSorted())
      }

      async function scenario() {
        ${scenario}
      }
      console.log(JSON.stringify(await scenario()))
    `], {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 20_000,
      env: {
        ...process.env,
        UNI_PLATFORM: platform,
        VITE_ROOT_DIR: root,
        UNI_PAGES_TEST_ROOT: root,
      },
    })

    expect(result.error, result.stderr).toBeUndefined()
    expect(result.signal, result.stderr).toBeNull()
    expect(result.status, result.stderr).toBe(0)
    return JSON.parse(result.stdout.trim().split('\n').at(-1)!)
  }
  finally {
    rmSync(root, { recursive: true, force: true })
  }
}

describe('uni-pages 插件准备阶段', () => {
  it.each<Platform>(['h5', 'mp-weixin'])('%s 的并发准备和 Vite 接管复用一次扫描并等待两份产物', (platform) => {
    const result = runScenario(`
      let scans = 0
      const plugin = UniPages({ ...baseOptions, platformSuffix: true, onBeforeScanPages() { scans += 1 } })
      assert.equal(plugin.name, 'vite-plugin-uni-pages')
      assert.equal(typeof plugin.then, 'undefined')
      assert.deepEqual(await Promise.all([plugin.prepare(environment), plugin.prepare({ ...environment })]), [undefined, undefined])
      await plugin.prepare(environment)
      const prepared = readPages()
      const declaration = readDeclaration()
      assert.equal(scans, 1)
      await configure(plugin, { withPlatformPlugin: true })
      assert.equal(scans, 1)
      assert.deepEqual(readPages(), prepared)
      assert.equal(readDeclaration(), declaration)
      assert.equal(prepared.globalStyle.navigationBarTitleText, '共享配置')
      await dispose(plugin)
      return {
        main: prepared.pages.map(page => page.path),
        sub: prepared.subPackages[0].pages.map(page => ({ path: page.path, title: page.style.navigationBarTitleText })),
        tabs: prepared.tabBar.list.map(item => ({ path: item.pagePath, text: item.text })),
        declaration,
      }
    `, platform)

    expect(result.main).toEqual(['pages/index', 'pages/profile'])
    expect(result.sub).toEqual([{ path: 'pages/detail', title: platform === 'h5' ? '网页详情' : '微信详情' }])
    expect(result.tabs).toEqual([
      { path: 'pages/index', text: '首页' },
      { path: 'pages/profile', text: platform === 'h5' ? '网页' : '微信' },
    ])
    expect(result.declaration).toContain('"/packages/demo/pages/detail"')
    expect(result.declaration).toContain('"/pages/profile"')
    expect(result.declaration).not.toMatch(/\.h5|\.mp-weixin/)
  })

  it('提前准备要求显式确定平台后缀规则', () => {
    expect(runScenario(`
      const original = JSON.stringify({ pages: [{ path: 'pages/previous' }] })
      writeFileSync(pagesPath, original)
      const plugin = UniPages(baseOptions)
      assert.equal(typeof plugin.prepare, 'function')
      await assert.rejects(async () => plugin.prepare(environment))
      assert.equal(readFileSync(pagesPath, 'utf8'), original)
      await dispose(plugin)
      return true
    `)).toBe(true)
  })

  it('准备失败保留既有产物，修复后可重试且成功上下文继续复用', () => {
    expect(runScenario(`
      const original = JSON.stringify({ pages: [{ path: 'pages/previous' }] })
      writeFileSync(pagesPath, original)
      writeFileSync(dtsPath, '// previous declaration')
      const failure = new Error('扫描配置未就绪')
      let fail = true
      let scans = 0
      const plugin = UniPages({
        ...baseOptions,
        platformSuffix: true,
        onBeforeScanPages() { scans += 1; if (fail) throw failure },
      })
      const attempts = await Promise.allSettled([plugin.prepare(environment), plugin.prepare(environment)])
      assert.equal(scans, 1)
      assert.ok(attempts.every(result => result.status === 'rejected' && result.reason === failure))
      assert.equal(readFileSync(pagesPath, 'utf8'), original)
      assert.equal(readDeclaration(), '// previous declaration')
      fail = false
      await plugin.prepare(environment)
      assert.equal(scans, 2)
      assert.equal(readPages().pages[0].path, 'pages/index')
      assert.ok(readDeclaration().includes('"/pages/profile"'))
      await configure(plugin)
      assert.equal(scans, 2)
      await dispose(plugin)
      return true
    `)).toBe(true)
  })

  it('写入后钩子失败时恢复两份既有产物，修正后可以重新准备并接管', () => {
    expect(runScenario(`
      const original = JSON.stringify({ pages: [{ path: 'pages/previous' }] })
      const declaration = '// previous declaration'
      writeFileSync(pagesPath, original)
      writeFileSync(dtsPath, declaration)
      const failure = new Error('写入后校验失败')
      let fail = true
      let writes = 0
      const plugin = UniPages({
        ...baseOptions,
        platformSuffix: true,
        onAfterWriteFile() { writes += 1; if (fail) throw failure },
      })
      await assert.rejects(async () => plugin.prepare(environment), error => error === failure)
      assert.equal(writes, 1)
      assert.equal(readFileSync(pagesPath, 'utf8'), original)
      assert.equal(readDeclaration(), declaration)
      fail = false
      await plugin.prepare(environment)
      assert.equal(writes, 2)
      assert.equal(readPages().pages[0].path, 'pages/index')
      assert.ok(readDeclaration().includes('"/pages/profile"'))
      await configure(plugin)
      assert.equal(writes, 2)
      await dispose(plugin)
      return true
    `)).toBe(true)
  })

  it('准备成功后拒绝不同根目录或平台的再次准备和 Vite 接管', () => {
    expect(runScenario(`
      const plugin = UniPages({ ...baseOptions, platformSuffix: true })
      await plugin.prepare(environment)
      const original = readFileSync(pagesPath, 'utf8')
      await assert.rejects(async () => plugin.prepare({ ...environment, root: join(root, 'other') }))
      await assert.rejects(async () => plugin.prepare({ ...environment, platform: 'mp-weixin' }))
      await assert.rejects(() => configure(plugin, { configRoot: join(root, 'other') }))
      assert.equal(readFileSync(pagesPath, 'utf8'), original)
      await configure(plugin)
      await dispose(plugin)
      return true
    `)).toBe(true)
  })

  it('显式准备的平台与 Vite 运行平台不同时拒绝接管', () => {
    expect(runScenario(`
      const plugin = UniPages({ ...baseOptions, platformSuffix: true })
      await plugin.prepare({ root, platform: 'h5' })
      const original = readFileSync(pagesPath, 'utf8')
      await assert.rejects(() => configure(plugin))
      assert.equal(readFileSync(pagesPath, 'utf8'), original)
      await dispose(plugin)
      return true
    `, 'mp-weixin')).toBe(true)
  })

  it('准备后页面输入变化时拒绝接管，避免覆盖下游已经读取的产物', () => {
    expect(runScenario(`
      let scans = 0
      const plugin = UniPages({ ...baseOptions, platformSuffix: true, onBeforeScanPages() { scans += 1 } })
      await plugin.prepare(environment)
      const original = readFileSync(pagesPath, 'utf8')
      const declaration = readDeclaration()
      addFile('src/pages/late.vue')
      await assert.rejects(() => configure(plugin))
      assert.equal(scans, 1)
      assert.equal(readFileSync(pagesPath, 'utf8'), original)
      assert.equal(readDeclaration(), declaration)
      await dispose(plugin)
      return true
    `)).toBe(true)
  })

  it.each(['pages.json', '声明文件'])('准备后%s被外部改写时拒绝接管并保留外部内容', (artifact) => {
    expect(runScenario(`
      let scans = 0
      const plugin = UniPages({ ...baseOptions, platformSuffix: true, onBeforeScanPages() { scans += 1 } })
      await plugin.prepare(environment)
      const original = readFileSync(pagesPath, 'utf8')
      const declaration = readDeclaration()
      const editedPath = ${artifact === 'pages.json' ? 'pagesPath' : 'dtsPath'}
      const external = ${artifact === 'pages.json'
        ? `JSON.stringify({ pages: [{ path: 'pages/external' }] })`
        : `'// externally changed declaration'`}
      writeFileSync(editedPath, external)
      await assert.rejects(() => configure(plugin))
      assert.equal(scans, 1)
      assert.equal(readFileSync(editedPath, 'utf8'), external)
      if (editedPath === pagesPath) assert.equal(readDeclaration(), declaration)
      else assert.equal(readFileSync(pagesPath, 'utf8'), original)
      await dispose(plugin)
      return true
    `)).toBe(true)
  })
})

describe('uni-pages 配置依赖', () => {
  it.each<Platform>(['h5', 'mp-weixin'])('%s 监听多层配置依赖并在导入切换后更新依赖范围', (platform) => {
    expect(runScenario(`
      unlinkSync(join(root, 'pages.config.mjs'))
      addFile('package.json', JSON.stringify({ type: 'module' }))
      const configSource = dependency => 'import { THEME } from "' + dependency + '"; export default { pages: [], globalStyle: { navigationBarTitleText: [THEME.one, THEME.two, THEME.json, THEME.cjs].join("|") }, tabBar: { custom: THEME.custom } }'
      const themeSource = one => 'import { DEEP } from "./deep"; export const THEME = { one: ' + one + ', custom: ' + (one % 2 === 1) + ', ...DEEP }'
      const deepSource = two => 'import palette from "./palette.json"; import legacy from "./legacy.cjs"; export const DEEP = { two: ' + two + ', json: palette.value, cjs: legacy.value }'
      addFile('pages.config.ts', configSource('./config/theme'))
      addFile('config/theme.ts', themeSource(0))
      addFile('config/deep.ts', deepSource(0))
      addFile('config/palette.json', JSON.stringify({ value: 0 }))
      addFile('config/legacy.cjs', 'module.exports = { value: 0 }')
      addFile('alternate/theme.ts', 'export const THEME = { one: 5, two: 6, json: 7, cjs: 8, custom: false }')
      let loads = 0
      const plugin = UniPages({ ...baseOptions, platformSuffix: true, onAfterLoadUserConfig() { loads += 1 } })
      const require = createRequire(import.meta.resolve('@uni-helper/vite-plugin-uni-pages'))
      const { default: chokidar } = await import(pathToFileURL(require.resolve('chokidar')).href)
      const observer = chokidar.watch(root, { ignoreInitial: true })
      await once(observer, 'ready')
      const state = () => {
        const config = readPages()
        return { title: config.globalStyle.navigationBarTitleText, custom: config.tabBar.custom }
      }
      async function waitConfig(title, custom) {
        const deadline = Date.now() + 3_000
        while (Date.now() < deadline) {
          if (state().title === title && state().custom === custom) return
          await delay(20)
        }
        assert.deepEqual(state(), { title, custom })
      }
      async function changeObservedFile(file, content) {
        const absolute = join(root, file)
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            observer.off('all', changed)
            reject(new Error('未收到配置依赖的文件事件: ' + file))
          }, 3_000)
          function changed(event, path) {
            if (event === 'change' && path === absolute) {
              clearTimeout(timer)
              observer.off('all', changed)
              resolve()
            }
          }
          observer.on('all', changed)
          addFile(file, content)
        })
      }
      try {
        await plugin.prepare(environment)
        await configure(plugin, { watch: platform === 'mp-weixin', command: platform === 'h5' ? 'serve' : 'build' })
        if (platform === 'h5') {
          await callHook(plugin, 'configureServer', {
            watcher: observer,
            moduleGraph: { getModulesByFile() { return undefined } },
            ws: { send() {} },
          })
        }
        await waitConfig('0|0|0|0', false)
        addFile('config/theme.ts', themeSource(1))
        await waitConfig('1|0|0|0', true)
        addFile('config/deep.ts', deepSource(2))
        await waitConfig('1|2|0|0', true)
        addFile('config/palette.json', JSON.stringify({ value: 3 }))
        await waitConfig('1|2|3|0', true)
        addFile('config/legacy.cjs', 'module.exports = { value: 4 }')
        await waitConfig('1|2|3|4', true)

        addFile('pages.config.ts', configSource('./alternate/theme'))
        await waitConfig('5|6|7|8', false)
        // 新依赖加入监听时可能产生 add 事件，等待这轮生成收敛后记录基线
        await delay(150)
        const loadsAfterSwitch = loads
        await changeObservedFile('config/theme.ts', themeSource(9))
        // 观察已移除依赖的真实文件事件，覆盖插件的批处理窗口
        await delay(150)
        assert.equal(loads, loadsAfterSwitch, '已移除的依赖不应再触发配置加载')
        await changeObservedFile('alternate/theme.ts', 'export const THEME = { one: 9, two: 6, json: 7, cjs: 8, custom: true }')
        await waitConfig('9|6|7|8', true)
        return true
      }
      finally {
        await dispose(plugin)
        assert.equal(observer.closed, false)
        await observer.close()
      }
    `, platform)).toBe(true)
  }, 25_000)

  it('无模块类型配置的 TS 与 CTS 保留包导入、具名导出和本地 CommonJS 依赖', () => {
    for (const { extension, named } of [{ extension: 'ts', named: false }, { extension: 'cts', named: false }, { extension: 'ts', named: true }]) {
      expect(runScenario(`
        unlinkSync(join(root, 'pages.config.mjs'))
        symlinkSync(join(process.cwd(), 'node_modules'), join(root, 'node_modules'), 'dir')
        addFile('config/legacy.cjs', 'const { basename } = require("node:path"); module.exports = { title: basename("/config/兼容配置") }')
        addFile('pages.config.${extension}', 'import { defineUniPages } from "@uni-helper/vite-plugin-uni-pages"; import legacy from "./config/legacy.cjs"; ${named ? 'export const { pages, globalStyle } =' : 'export default'} defineUniPages({ pages: [], globalStyle: { navigationBarTitleText: legacy.title } })')
        const plugin = UniPages({ ...baseOptions, platformSuffix: true })
        try {
          await plugin.prepare(environment)
          await configure(plugin)
          assert.equal(readPages().globalStyle.navigationBarTitleText, '兼容配置')
          return true
        }
        finally {
          await dispose(plugin)
        }
      `)).toBe(true)
    }
  })

  it('配置来源保留自定义解析、转换和重写语义', () => {
    for (const parser of ['custom', 'transform', 'import']) {
      expect(runScenario(`
        unlinkSync(join(root, 'pages.config.mjs'))
        const kind = '${parser}'
        const calls = []
        const title = '配置内容'
        const config = { pages: [], globalStyle: { navigationBarTitleText: title } }
        addFile('custom.config.ts', kind === 'import' ? 'export default ' + JSON.stringify(config) : title)
        const source = {
          files: 'custom.config',
          extensions: ['ts'],
          rewrite(config, file) {
            assert.equal(file, join(root, 'custom.config.ts'))
            assert.equal(config.globalStyle.navigationBarTitleText, title)
            calls.push('rewrite')
            return { ...config, globalStyle: { navigationBarTitleText: title + '已重写' } }
          },
        }
        if (kind === 'custom') {
          source.parser = file => {
            assert.equal(readFileSync(file, 'utf8'), title)
            calls.push('parser')
            return config
          }
        }
        else if (kind === 'transform') {
          source.transform = (content, file) => {
            assert.equal(file, join(root, 'custom.config.ts'))
            assert.equal(content, title)
            calls.push('transform')
            return 'export default ' + JSON.stringify(config)
          }
        }
        else source.parser = 'import'
        const plugin = UniPages({ ...baseOptions, platformSuffix: true, configSource: source })
        try {
          await plugin.prepare(environment)
          await configure(plugin)
          assert.equal(readPages().globalStyle.navigationBarTitleText, title + '已重写')
          assert.deepEqual(calls, kind === 'import' ? ['rewrite'] : [kind === 'custom' ? 'parser' : 'transform', 'rewrite'])
          return true
        }
        finally {
          await dispose(plugin)
        }
      `)).toBe(true)
    }
  })

  it('无效导出或重写拒绝时继续选择后续配置来源', () => {
    for (const rejection of ['export', 'rewrite']) {
      expect(runScenario(`
        unlinkSync(join(root, 'pages.config.mjs'))
        const rejection = '${rejection}'
        addFile('first.config.ts', rejection === 'export' ? 'export default false' : 'export default { pages: [] }')
        addFile('second.config.ts', 'export default { pages: [], globalStyle: { navigationBarTitleText: "后备配置" } }')
        const rewritten = []
        const plugin = UniPages({
          ...baseOptions,
          platformSuffix: true,
          configSource: [
            { files: 'first.config', extensions: ['ts'], rewrite(config) { rewritten.push('first'); return rejection === 'rewrite' ? false : config } },
            { files: 'second.config', extensions: ['ts'], rewrite(config) { rewritten.push('second'); return config } },
          ],
        })
        try {
          await plugin.prepare(environment)
          await configure(plugin)
          assert.equal(readPages().globalStyle?.navigationBarTitleText, '后备配置')
          assert.deepEqual(rewritten, rejection === 'rewrite' ? ['first', 'second'] : ['second'])
          return true
        }
        finally {
          await dispose(plugin)
        }
      `)).toBe(true)
    }
  })

  it('准备后间接 JSON 依赖改变时拒绝接管并保留已生成产物', () => {
    expect(runScenario(`
      unlinkSync(join(root, 'pages.config.mjs'))
      addFile('package.json', JSON.stringify({ type: 'module' }))
      addFile('pages.config.ts', 'import { title } from "./config/theme"; export default { pages: [], globalStyle: { navigationBarTitleText: title } }')
      addFile('config/theme.ts', 'import palette from "./palette.json"; export const title = palette.title')
      addFile('config/palette.json', JSON.stringify({ title: '初始配置' }))
      const plugin = UniPages({ ...baseOptions, platformSuffix: true })
      try {
        await plugin.prepare(environment)
        const original = readFileSync(pagesPath, 'utf8')
        const declaration = readDeclaration()
        addFile('config/palette.json', JSON.stringify({ title: '修改后的配置' }))
        await assert.rejects(() => configure(plugin))
        assert.equal(readFileSync(pagesPath, 'utf8'), original)
        assert.equal(readDeclaration(), declaration)
        return true
      }
      finally {
        await dispose(plugin)
      }
    `)).toBe(true)
  })
})

describe('uni-pages 平台页面配置', () => {
  it.each([
    { name: '显式启用不依赖平台插件', suffix: true, detected: false, normalized: true },
    { name: '显式关闭优先于平台插件检测', suffix: false, detected: true, normalized: false },
    { name: '未指定时采用平台插件检测', suffix: undefined, detected: true, normalized: true },
    { name: '未指定且没有平台插件时保留后缀', suffix: undefined, detected: false, normalized: false },
  ])('$name', ({ suffix, detected, normalized }) => {
    const result = runScenario(`
      const plugin = UniPages({ ...baseOptions, platformSuffix: ${String(suffix)} })
      await configure(plugin, { withPlatformPlugin: ${detected} })
      const output = readPages()
      await dispose(plugin)
      return {
        main: output.pages.map(page => page.path),
        sub: output.subPackages[0].pages.map(page => page.path),
        tabs: output.tabBar.list.map(item => item.pagePath),
      }
    `)

    expect(result).toEqual(normalized
      ? { main: ['pages/index', 'pages/profile'], sub: ['pages/detail'], tabs: ['pages/index', 'pages/profile'] }
      : {
          main: ['pages/index', 'pages/profile.h5', 'pages/profile.mp-weixin'],
          sub: ['pages/detail.h5', 'pages/detail.mp-weixin'],
          tabs: ['pages/index', 'pages/profile.h5', 'pages/profile.mp-weixin'],
        })
  })

  it.each<Platform>(['h5', 'mp-weixin'])('%s 的手动页面与 TabBar 按声明顺序合并同路径配置', (platform) => {
    const result = runScenario(`
      const variants = [{ suffix: '', text: '默认' }, { suffix: '.h5', text: '网页' }, { suffix: '.mp-weixin', text: '微信' }]
      writeFileSync(join(root, 'pages.config.mjs'), 'export default ' + JSON.stringify({
        pages: variants.map(({ suffix, text }) => ({ path: 'pages/profile' + suffix, style: { navigationBarTitleText: text } })),
        tabBar: { list: variants.map(({ suffix, text }) => ({ pagePath: 'pages/profile' + suffix, text })) },
      }))
      const plugin = UniPages({ ...baseOptions, platformSuffix: true, mergePages: false })
      await plugin.prepare(environment)
      const output = readPages()
      await configure(plugin)
      assert.deepEqual(readPages(), output)
      await dispose(plugin)
      return {
        pages: output.pages.map(page => ({ path: page.path, title: page.style.navigationBarTitleText })),
        subPackages: output.subPackages ?? [],
        tabs: output.tabBar.list,
      }
    `, platform)

    const text = platform === 'h5' ? '网页' : '微信'
    expect(result).toEqual({
      pages: [{ path: 'pages/profile', title: text }],
      subPackages: [],
      tabs: [{ pagePath: 'pages/profile', text }],
    })
  })

  it.each<Platform>(['h5', 'mp-weixin'])('%s 的平台后缀首页归一化后优先于其他页面', (platform) => {
    expect(runScenario(`
      unlinkSync(join(root, 'src/pages/index.vue'))
      for (const filename of ['aaa.vue', 'index.h5.vue', 'index.mp-weixin.vue']) addFile('src/pages/' + filename)
      const plugin = UniPages({ ...baseOptions, platformSuffix: true, homePage: 'pages/index' })
      await plugin.prepare(environment)
      const output = readPages()
      await configure(plugin)
      assert.deepEqual(readPages(), output)
      await dispose(plugin)
      return output.pages[0].path
    `, platform)).toBe('pages/index')
  })
})

describe('uni-pages 分包 glob', () => {
  it('混合固定目录与多个 glob，按相对 POSIX 路径计算包根并去重相同映射', () => {
    const result = runScenario(`
      addFile('src/manual/entry.vue')
      addFile('src/other/help/pages/index.vue')
      const matched = []
      const packageRoot = dir => { matched.push(dir); return rootForPackage(dir) }
      const options = {
        ...baseOptions,
        platformSuffix: true,
        subPackages: [
          'src/manual',
          { dir: 'src/packages/*/pages', root: packageRoot },
          { dir: join(root, 'src/packages/demo/pages'), root: 'packages/demo' },
          { dir: 'src/other/*/pages', root: packageRoot },
        ],
      }
      const original = options.subPackages.map(entry => typeof entry === 'string' ? entry : { ...entry })
      const plugin = UniPages(options)
      await plugin.prepare(environment)
      const output = readPages()
      await configure(plugin)
      assert.deepEqual(options.subPackages, original)
      assert.deepEqual(new Set(matched), new Set(['src/packages/demo/pages', 'src/other/help/pages']))
      await dispose(plugin)
      return output.subPackages.map(pkg => ({ root: pkg.root, paths: pkg.pages.map(page => page.path) })).sort((a, b) => a.root.localeCompare(b.root))
    `)

    expect(result).toEqual([
      { root: 'manual', paths: ['entry'] },
      { root: 'other/help', paths: ['pages/index'] },
      { root: 'packages/demo', paths: ['pages/detail'] },
    ])
  })

  it.each(['同一目录映射到不同包根', '不同目录映射到同一包根'])('%s时拒绝生成并保留既有配置', (conflict) => {
    expect(runScenario(`
      addFile('src/packages/other/pages/index.vue')
      const original = JSON.stringify({ pages: [{ path: 'pages/previous' }] })
      writeFileSync(pagesPath, original)
      const subPackages = ${conflict === '同一目录映射到不同包根'
        ? `[{ dir: 'src/packages/demo/pages', root: 'packages/demo' }, { dir: 'src/packages/demo/pages', root: 'packages' }]`
        : `[{ dir: 'src/packages/*/pages', root: 'packages' }]`}
      const plugin = UniPages({ ...baseOptions, platformSuffix: true, subPackages })
      assert.equal(typeof plugin.prepare, 'function')
      await assert.rejects(async () => plugin.prepare(environment))
      assert.equal(readFileSync(pagesPath, 'utf8'), original)
      await dispose(plugin)
      return true
    `)).toBe(true)
  })

  it.each<Platform>(['h5', 'mp-weixin'])('%s 监听从零匹配到新增、整包删除重建和重命名', (platform) => {
    expect(runScenario(`
      addFile('src/manual/entry.vue')
      const plugin = UniPages({ ...baseOptions, platformSuffix: true, subPackages: ['src/manual', globPackages] })
      let sharedWatcher
      try {
        await plugin.prepare(environment)
        await configure(plugin, { watch: platform === 'mp-weixin', command: platform === 'h5' ? 'serve' : 'build' })
        if (platform === 'h5') {
          const require = createRequire(import.meta.resolve('@uni-helper/vite-plugin-uni-pages'))
          const { default: chokidar } = await import(pathToFileURL(require.resolve('chokidar')).href)
          sharedWatcher = chokidar.watch(root, { ignoreInitial: true })
          await once(sharedWatcher, 'ready')
          await callHook(plugin, 'configureServer', {
            watcher: sharedWatcher,
            moduleGraph: { getModulesByFile() { return undefined } },
            ws: { send() {} },
          })
        }
        else {
          // DCloud 每次 BUNDLE_END 都会关闭当次 bundle，目录监听仍须保留
          await callHook(plugin, 'closeBundle')
        }
        const base = ['/pages/index', '/pages/profile', '/manual/entry']
        await waitRoutes(base)

        addFile('src/packages/empty/components/Card.vue')
        addFile('src/packages/.hidden/pages/index.vue')
        addFile('src/packages/alpha/components/Card.vue')
        addFile('src/packages/alpha/pages/components/LocalCard.vue')
        addFile('src/packages/alpha/pages/_draft.vue')
        addFile('src/packages/alpha/nested/pages/index.vue')
        addFile('src/packages/alpha/pages/index.vue')
        await waitRoutes([...base, '/packages/alpha/pages/index'])

        rmSync(join(root, 'src/packages/alpha'), { recursive: true })
        await waitRoutes(base)
        addFile('src/packages/alpha/pages/index.vue', '<script setup>definePage({ style: { navigationBarTitleText: "重建后" } })</script><template><view /></template>')
        await waitRoutes([...base, '/packages/alpha/pages/index'])
        assert.equal(readPages().subPackages.find(pkg => pkg.root === 'packages/alpha').pages[0].style.navigationBarTitleText, '重建后')

        renameSync(join(root, 'src/packages/alpha'), join(root, 'src/packages/beta'))
        await waitRoutes([...base, '/packages/beta/pages/index'])
        rmSync(join(root, 'src/packages'), { recursive: true })
        await waitRoutes(base)
        addFile('src/packages/gamma/pages/index.vue')
        await waitRoutes([...base, '/packages/gamma/pages/index'])
        return true
      }
      finally {
        await dispose(plugin)
        if (sharedWatcher) {
          assert.equal(sharedWatcher.closed, false)
          await sharedWatcher.close()
        }
      }
    `, platform, { seedSubPackage: false })).toBe(true)
  }, 25_000)
})
