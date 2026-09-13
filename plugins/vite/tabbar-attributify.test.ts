// @vitest-environment node
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { expect, it } from 'vitest'

const runNode = promisify(execFile)

// 平台必须在 presetUni 及其 uni-env 依赖加载前确定，避免复用 H5 模块缓存
const program = String.raw`
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import MagicString from 'magic-string'
import { createGenerator } from 'unocss'
import { parse } from 'vue/compiler-sfc'
import config from './uno.config.ts'

const filename = process.argv[1]
const uno = await createGenerator(config)
const source = new MagicString(readFileSync(filename, 'utf8'))
const context = { uno, tokens: new Set() }
assert.ok(uno.config.transformers.some(transformer => transformer.name === 'transformer-attributify'))
for (const transformer of uno.config.transformers) {
  await transformer.transform(source, filename, context)
}

const { descriptor, errors } = parse(source.toString(), { filename })
assert.deepEqual(errors, [])
const tabbars = []
function collect(node) {
  if (node.type === 1 && ['Tabbar', 'TabbarAnimated', 'TabbarRaised'].includes(node.tag))
    tabbars.push(node)
  for (const child of node.children ?? []) collect(child)
}
collect(descriptor.template.ast)
assert.equal(tabbars.length, Number(process.argv[2]))
for (const tabbar of tabbars) {
  for (const name of ['color', 'active-color']) {
    const binding = tabbar.props.find(prop => prop.type === 7 && prop.name === 'bind' && prop.arg?.content === name)
    assert.ok(binding?.exp?.content, tabbar.tag + ' 丢失 ' + name + ' 属性绑定')
  }
}

// 动态字面量虽能保留 props，仍可能被 extractor 识别成小程序不支持的属性选择器
const { css } = await uno.generate(source.toString())
assert.doesNotMatch(css, /\[(?:active-)?color[~|^$*]?=/)
assert.ok(![...context.tokens].some(token => token.includes('color~')), '颜色绑定生成了属性选择器 token')
`

it.each([
  ['src/components/App/PageTabbar.vue', 1],
  ['src/packages/journal/pages/appearance.vue', 3],
])('%s 经小程序 Uno 转换后保留底栏颜色绑定且不生成属性选择器', async (filename, count) => {
  const result = await runNode(process.execPath, ['--input-type=module', '-e', program, filename, String(count)], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    env: { ...process.env, UNI_PLATFORM: 'mp-weixin' },
    timeout: 10000,
  })
  expect(result.stdout).toBe('')
})
