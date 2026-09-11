// @vitest-environment node
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { expect, it } from 'vitest'

const runNode = promisify(execFile)

// 使用应用实际安装的 Vite 和 UnoCSS，重现 uni-app 对同一入口的多次解析
const program = String.raw`
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import UnoCSS from 'unocss/vite'
import { resolveConfig } from 'vite'

const root = await mkdtemp(join(tmpdir(), 'unocss-import-'))
try {
  const config = await resolveConfig({
    root, configFile: false, logLevel: 'silent',
    plugins: [UnoCSS({ configFile: false, presets: [] })],
  }, 'build')
  const plugin = config.plugins.find(plugin => plugin.name === 'unocss:global:build:scan')
  const warnings = []
  const context = { warn: message => warnings.push(message) }
  const resolve = importer => plugin.resolveId.call(context, 'uno.css', importer)
  const importer = join(root, 'src/main.ts')
  const entry = await resolve(importer)
  assert.equal(entry, join(root, 'src/__uno.css'))
  if (process.argv[1] === 'same') {
    for (let count = 0; count < 3; count++)
      assert.equal(await resolve(importer), entry)
    assert.deepEqual(warnings, [], '同一虚拟入口被重复解析时不应报警')
  }
  else {
    assert.equal(await resolve(join(root, 'other/main.ts')), entry)
    assert.equal(warnings.length, 1, '不同目录的入口冲突仍应报警')
    assert.match(warnings[0], /being imported multiple times/)
    assert.ok(warnings[0].includes(entry))
  }
}
finally {
  await rm(root, { recursive: true, force: true })
}
`

it.each([
  ['same', '同一 UnoCSS 入口重复解析不产生警告'],
  ['different', '不同目录的 UnoCSS 入口保留冲突警告'],
])('%s: %s', async (mode) => {
  const result = await runNode(process.execPath, ['--input-type=module', '-e', program, mode], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    timeout: 10000,
  })
  expect(result.stdout).toBe('')
})
