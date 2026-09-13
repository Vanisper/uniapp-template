import type { TabbarExpose } from '../type'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import TabbarRaised from './index.vue'

const list = [
  { label: '发现', route: 'pages/index', icon: '/discover.png', activeIcon: '/discover-active.png' },
  { label: '笔记', route: 'pages/notes', icon: '/notes.png', activeIcon: '/notes-active.png' },
  { label: '我的', route: 'pages/about', icon: '/profile.png', activeIcon: '/profile-active.png' },
]

function mountTabbar(beforeChange = vi.fn(() => true)) {
  return mount(TabbarRaised, {
    props: {
      list,
      height: 72,
      value: 'pages/index',
      textField: 'label',
      valueField: 'route',
      iconField: 'icon',
      activeIconField: 'activeIcon',
      beforeChange,
    },
  })
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('raisedTabbar', () => {
  it('抬起项随受控值定位，沿用自定义文字、值和图标字段', async () => {
    const wrapper = mountTabbar()

    expect(wrapper.find('.raised-tabbar__content--active').text()).toBe('发现')
    expect(wrapper.find('.raised-tabbar__content--active image').attributes('src')).toBe('/discover-active.png')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(0%)')
    expect(wrapper.find('.tabbar-placeholder').attributes('style')).toContain('height: 72px')

    await wrapper.setProps({ value: 'pages/about' })

    expect(wrapper.find('.raised-tabbar__content--active').text()).toBe('我的')
    expect(wrapper.find('.raised-tabbar__content--active image').attributes('src')).toBe('/profile-active.png')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(200%)')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
  })

  it('点击使凹槽和图标一起预选，确认拒绝时同时恢复', async () => {
    const beforeChange = vi.fn(() => false)
    const wrapper = mountTabbar(beforeChange)

    await wrapper.findAll('.tabbar__item')[1].trigger('click')

    expect(wrapper.find('.raised-tabbar__content--active').text()).toBe('笔记')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(100%)')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('transition-duration: 260ms')
    expect(wrapper.find('.raised-tabbar__content--active image').attributes('style')).toContain('transition-duration: 260ms')
    expect(beforeChange).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(260)

    expect(beforeChange).toHaveBeenCalledExactlyOnceWith({ text: '笔记', value: 'pages/notes' }, list[1])
    expect(wrapper.find('.raised-tabbar__content--active').text()).toBe('发现')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(0%)')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('对外取消会停止待确认选择，后续切换仍能正常确认', async () => {
    const beforeChange = vi.fn(() => true)
    const wrapper = mountTabbar(beforeChange)

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    ;(wrapper.vm as unknown as TabbarExpose).cancel()
    await nextTick()
    await vi.advanceTimersByTimeAsync(260)

    expect(wrapper.find('.raised-tabbar__content--active').text()).toBe('发现')
    expect(beforeChange).not.toHaveBeenCalled()

    await wrapper.findAll('.tabbar__item')[2].trigger('click')
    await vi.advanceTimersByTimeAsync(260)

    expect(beforeChange).toHaveBeenCalledExactlyOnceWith({ text: '我的', value: 'pages/about' }, list[2])
    expect(wrapper.emitted('change')).toEqual([[{ text: '我的', value: 'pages/about' }, list[2]]])
  })
})
