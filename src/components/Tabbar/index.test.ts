import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
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

describe('tabbar', () => {
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

  it('先移动指示器再发出一次结构正确的 change 事件', async () => {
    vi.useFakeTimers()

    try {
      const wrapper = mountTabbar('pages/index')
      await wrapper.findAll('.tabbar__item')[1].trigger('click')

      expect(wrapper.find('.tabbar__indicator').attributes('style')).toContain('translateX(100%)')
      expect(wrapper.emitted('change')).toBeUndefined()

      vi.advanceTimersByTime(260)

      expect(wrapper.emitted('change')).toEqual([[
        { text: '关于', value: 'pages/about' },
        list[1],
      ]])
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('点击活动项不重复发出 change 事件', async () => {
    const wrapper = mountTabbar('pages/index')
    await wrapper.findAll('.tabbar__item')[0].trigger('click')

    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('动画期间点回当前项会取消待执行的 change 事件', async () => {
    vi.useFakeTimers()

    try {
      const wrapper = mountTabbar('pages/index')
      const items = wrapper.findAll('.tabbar__item')

      await items[1].trigger('click')
      await items[0].trigger('click')
      vi.advanceTimersByTime(260)

      expect(wrapper.find('.tabbar__indicator').attributes('style')).toContain('translateX(0%)')
      expect(wrapper.emitted('change')).toBeUndefined()
    }
    finally {
      vi.useRealTimers()
    }
  })

  it('空列表不渲染活动指示器', () => {
    const wrapper = mountTabbar(undefined, [])

    expect(wrapper.find('.tabbar__indicator').exists()).toBe(false)
    expect(wrapper.findAll('.tabbar__item')).toHaveLength(0)
  })
})
