import type { UnocssPluginContext } from 'unocss'
import MagicString from 'magic-string'
import { createGenerator } from 'unocss'
import { presetApplet, transformerAttributify } from 'unocss-applet'
import { describe, expect, it } from 'vitest'
import { parse } from 'vue/compiler-sfc'

async function transformAttributes(attributes: string[], separator: string) {
  const input = ['<template><button', ...attributes, '>GO</button></template>'].join(separator)
  const source = new MagicString(input)
  const uno = await createGenerator({ presets: [presetApplet()] })
  const transformer = transformerAttributify()

  await transformer.transform(source, 'fixture.vue', { uno } as UnocssPluginContext)

  const { descriptor, errors } = parse(source.toString())
  expect(errors).toEqual([])

  const button = descriptor.template?.ast?.children[0]
  if (button?.type !== 1) {
    throw new Error('转换结果缺少 button 节点')
  }

  return Object.fromEntries(button.props.map((attribute) => {
    if (attribute.type !== 6) {
      throw new Error('静态属性被意外转换为指令')
    }
    return [attribute.name, attribute.value?.content]
  }))
}

describe('小程序属性样式转换', () => {
  it.each([
    ['LF 换行', '\n'],
    ['CRLF 换行', '\r\n'],
    ['制表符', '\t'],
    ['单行空格', ' '],
  ])('%s 分隔属性时生成完整 class 并保留 hover-class', async (_, separator) => {
    const attributes = await transformAttributes([
      'px-4',
      'py-1',
      'hover-class="bg-teal-700"',
    ], separator)

    expect(attributes).toEqual({
      'class': 'px-4 py-1',
      'hover-class': 'bg-teal-700',
    })
  })

  it('分组属性与无值属性同时出现时生成类名而不残留重复属性', async () => {
    const attributes = await transformAttributes([
      'm="t-3 auto"',
      'm-auto',
    ], '\n      ')

    expect(Object.keys(attributes)).toEqual(['class'])
    expect(attributes.class?.split(' ')).toEqual(expect.arrayContaining(['m-t-3', 'm-auto']))
  })
})
