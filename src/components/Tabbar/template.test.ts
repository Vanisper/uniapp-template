import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compile } from '@dcloudio/uni-mp-compiler'
import { parse } from '@vue/compiler-sfc'
import { describe, expect, inject, it } from 'vitest'

function compileTemplate(path: string) {
  const filename = fileURLToPath(new URL(path, import.meta.url))
  const { descriptor } = parse(readFileSync(filename, 'utf8'), { filename })
  let wxml = ''
  compile(descriptor.template!.content, {
    filename,
    mode: 'module',
    miniProgram: {
      directive: 'wx:',
      class: { array: true },
      event: { key: true },
      slot: { fallbackContent: false, dynamicSlotNames: true },
      component: { dir: 'wxcomponents' },
      emitFile: (asset) => {
        wxml = String(asset.source)
        return filename
      },
    },
  })
  return wxml
}

// DOM 挂载不会执行 WXML 编译，必须检查微信实际使用的插槽出口
describe.runIf(inject('uniPlatform') === 'mp-weixin')('tabbar 微信模板', () => {
  it.each(['./index.vue', './Animated/index.vue'])('%s 的循环图文插槽使用独立名称', (path) => {
    const wxml = compileTemplate(path)
    expect(wxml).toContain('wx:for=')
    expect(wxml).toMatch(/<slot name="\{\{[^}]+\}\}"/)
    expect(wxml).not.toContain('<slot name="item"')
  })
})
