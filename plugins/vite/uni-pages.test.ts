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

function runScenario(scenario: string, platform: Platform = 'h5') {
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
      const destination = join(root, path)
      mkdirSync(dirname(destination), { recursive: true })
      writeFileSync(destination, content)
    }

    // uni-env 在模块导入时读取平台，使用独立进程隔离真实库的运行环境
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict'
      import { once } from 'node:events'
      import { mkdirSync, readFileSync, renameSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
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
      rmSync(join(root, 'src/packages'), { recursive: true })
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
    `, platform)).toBe(true)
  }, 25_000)
})
