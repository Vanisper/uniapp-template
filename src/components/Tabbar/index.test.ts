import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import Tabbar from './index.vue'

const list = [
  { text: '首页', pagePath: 'pages/index' },
  { text: '关于', pagePath: 'pages/about' },
]

function mountTabbar(value?: string | number, items = list) {
  return mount(Tabbar, {
    props: {
      activeColor: '#0165ff',
      color: '#8c8c8c',
      value,
      height: 50,
      list: items,
      textField: 'text',
      valueField: 'pagePath',
    },
  })
}

enableAutoUnmount(afterEach)
afterEach(() => vi.useRealTimers())

describe('tabbar', () => {
  it('根据字符串值选择对应的唯一活动项', () => {
    const wrapper = mountTabbar('pages/about')

    expect(wrapper.findAll('.tabbar__item')[1].classes()).toContain('tabbar__item--active')
    expect(wrapper.findAll('.tabbar__item--active')).toHaveLength(1)
  })

  it.each([
    [1, 1],
    ['pages/missing', 0],
    [-1, 0],
    [0.5, 0],
    [Number.NaN, 0],
  ])('选中值 %s 对应索引 %s', (value, index) => {
    const wrapper = mountTabbar(value)
    expect(wrapper.findAll('.tabbar__item')[Number(index)].classes()).toContain('tabbar__item--active')
  })

  it('点击立即发出映射后的 change，选中态等待父级更新', async () => {
    vi.useFakeTimers()
    const wrapper = mountTabbar('pages/index')
    await wrapper.findAll('.tabbar__item')[1].trigger('click')

    expect(wrapper.emitted('change')).toEqual([[
      { text: '关于', value: 'pages/about' },
      list[1],
    ]])
    expect(wrapper.findAll('.tabbar__item')[0].classes()).toContain('tabbar__item--active')

    await wrapper.setProps({ value: 'pages/about' })
    expect(wrapper.findAll('.tabbar__item')[1].classes()).toContain('tabbar__item--active')
  })

  it('点击当前项不重复请求切换', async () => {
    const wrapper = mountTabbar('pages/index')
    await wrapper.findAll('.tabbar__item')[0].trigger('click')

    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('默认图标字段随受控选中值切换，缺少选中图标时沿用默认图标', async () => {
    const items = [
      { ...list[0], iconPath: 'static/tabbar/discover.png', selectedIconPath: 'static/tabbar/discover-active.png' },
      { ...list[1], iconPath: '/static/tabbar/notes.png' },
    ]
    const wrapper = mountTabbar('pages/index', items)

    expect(wrapper.findAll('image').map(icon => icon.attributes('src'))).toEqual([
      '/static/tabbar/discover-active.png',
      '/static/tabbar/notes.png',
    ])

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    expect(wrapper.find('image').attributes('src')).toBe('/static/tabbar/discover-active.png')

    await wrapper.setProps({ value: 'pages/about' })
    expect(wrapper.findAll('image').map(icon => icon.attributes('src'))).toEqual([
      '/static/tabbar/discover.png',
      '/static/tabbar/notes.png',
    ])
  })

  it('自定义图标字段映射也提供给替换内容的插槽', () => {
    const wrapper = mount(Tabbar, {
      props: {
        height: 50,
        list: [{ text: '首页', icon: '/home.png', activeIcon: '/home-active.png' }],
        iconField: 'icon',
        activeIconField: 'activeIcon',
      },
      slots: {
        item: ({ text, icon }) => h('text', {}, `${text} ${icon}`),
      },
    })

    expect(wrapper.find('.tabbar__item').text()).toBe('首页 /home-active.png')
    expect(wrapper.find('image').exists()).toBe(false)
  })

  it('插槽获得字段映射和选中态，替换内容后仍可点击', async () => {
    const wrapper = mount(Tabbar, {
      props: { height: 50, list, value: 'pages/about', valueField: 'pagePath' },
      slots: {
        indicator: ({ index, count }) => h('text', { class: 'custom-indicator' }, `${index}/${count}`),
        item: ({ text, active }) => h('text', {}, `${text}${active ? ' 已选' : ''}`),
      },
    })

    expect(wrapper.find('.custom-indicator').text()).toBe('1/2')
    expect(wrapper.findAll('.tabbar__item')[1].text()).toBe('关于 已选')
    await wrapper.findAll('.tabbar__item')[0].trigger('click')
    expect(wrapper.emitted('change')?.[0]).toEqual([{ value: 'pages/index', text: '首页' }, list[0]])
  })

  it('空列表不渲染标签', () => {
    const wrapper = mountTabbar(undefined, [])
    expect(wrapper.findAll('.tabbar__item')).toHaveLength(0)
  })

  it('未配置图标时保留纯文字内容', () => {
    const wrapper = mountTabbar()
    expect(wrapper.find('image').exists()).toBe(false)
    expect(wrapper.findAll('.tabbar__label').map(label => label.text())).toEqual(['首页', '关于'])
  })
})
