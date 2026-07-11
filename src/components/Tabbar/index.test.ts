import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Tabbar from './index.vue'

const list = [
  { text: '首页', pagePath: 'pages/index' },
  { text: '关于', pagePath: 'pages/about' },
]

function mountTabbar(defaultValue?: string | number, items = list) {
  return mount(Tabbar, {
    props: {
      activeColor: '#0165ff',
      color: '#8c8c8c',
      defaultValue,
      height: 50,
      list: items,
      textField: 'text',
      valueField: 'pagePath',
    },
  })
}

describe('Tabbar', () => {
  it('根据字符串值移动指示器并激活对应标签', () => {
    const wrapper = mountTabbar('pages/about')

    expect(wrapper.find('.tabbar__indicator').attributes('style')).toContain('translateX(100%)')
    expect(wrapper.findAll('.tabbar__item')[1].classes()).toContain('tabbar__item--active')
  })

  it('支持数字索引并在无效值时回退到首项', () => {
    const selected = mountTabbar(1)
    const fallback = mountTabbar('pages/missing')

    expect(selected.findAll('.tabbar__item')[1].classes()).toContain('tabbar__item--active')
    expect(fallback.findAll('.tabbar__item')[0].classes()).toContain('tabbar__item--active')
  })

  it('点击非活动项只发出一次结构正确的 change 事件', async () => {
    const wrapper = mountTabbar('pages/index')
    await wrapper.findAll('.tabbar__item')[1].trigger('click')

    expect(wrapper.emitted('change')).toEqual([[
      { text: '关于', value: 'pages/about' },
      list[1],
    ]])
  })

  it('点击活动项不重复发出 change 事件', async () => {
    const wrapper = mountTabbar('pages/index')
    await wrapper.findAll('.tabbar__item')[0].trigger('click')

    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('空列表不渲染活动指示器', () => {
    const wrapper = mountTabbar(undefined, [])

    expect(wrapper.find('.tabbar__indicator').exists()).toBe(false)
    expect(wrapper.findAll('.tabbar__item')).toHaveLength(0)
  })
})
