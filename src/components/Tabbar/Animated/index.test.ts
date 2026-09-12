import type { TabbarAnimatedExpose, TabbarAnimatedProps } from './type'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, inject, it, vi } from 'vitest'
import { defineComponent, h, KeepAlive, nextTick, reactive, shallowRef } from 'vue'
import TabbarAnimated from './index.vue'

const isH5 = inject('uniPlatform') === 'h5'

const list = [
  { text: '首页', pagePath: 'pages/index' },
  { text: '关于', pagePath: 'pages/about' },
  { text: '设置', pagePath: 'pages/settings' },
]

type Item = (typeof list)[number]

function mountTabbar(props: Partial<TabbarAnimatedProps<Item>> = {}) {
  return mount(TabbarAnimated<Item>, {
    props: {
      height: 50,
      list,
      value: 'pages/index',
      valueField: 'pagePath',
      textField: 'text',
      ...props,
    },
  })
}

function deferred() {
  let resolve!: (result: boolean) => void
  const promise = new Promise<boolean>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function mockMotion(matches: boolean) {
  const listeners = new Set<() => void>()
  const media = {
    matches,
    addEventListener: vi.fn((_event: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_event: string, listener: () => void) => listeners.delete(listener)),
  }
  vi.spyOn(window, 'matchMedia').mockReturnValue(media as unknown as MediaQueryList)
  return {
    media,
    setReduced(value: boolean) {
      media.matches = value
      listeners.forEach(listener => listener())
    },
  }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.useFakeTimers()
  mockMotion(false)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('animatedTabbar', () => {
  it('初始选中和外部受控更新直接就位，不播放点击动画', async () => {
    const wrapper = mountTabbar()
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')

    await wrapper.setProps({ value: 'pages/about' })

    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('translateX(100%)')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
    for (const label of wrapper.findAll('.animated-tabbar__label')) {
      expect(label.attributes('style')).toContain('transition-duration: 0ms')
    }
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('先显示目标动画，260ms 后才确认并发出 change', async () => {
    const beforeChange = vi.fn(() => true)
    const wrapper = mountTabbar({ beforeChange })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')

    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('translateX(100%)')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 260ms')
    expect(wrapper.find('.animated-tabbar__label').attributes('style')).toContain('transition-duration: 260ms')
    expect(beforeChange).not.toHaveBeenCalled()
    expect(wrapper.emitted('change')).toBeUndefined()

    await vi.advanceTimersByTimeAsync(259)
    expect(beforeChange).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)

    expect(beforeChange).toHaveBeenCalledExactlyOnceWith({ text: '关于', value: 'pages/about' }, list[1])
    expect(wrapper.emitted('change')).toEqual([[{ text: '关于', value: 'pages/about' }, list[1]]])
  })

  it('连续点击只处理最后一个目标', async () => {
    const beforeChange = vi.fn(() => true)
    const wrapper = mountTabbar({ beforeChange })
    const items = wrapper.findAll('.tabbar__item')
    await items[1].trigger('click')
    await vi.advanceTimersByTimeAsync(100)
    await items[2].trigger('click')
    await items[2].trigger('click')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('translateX(200%)')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 260ms')
    await vi.advanceTimersByTimeAsync(260)

    expect(beforeChange).toHaveBeenCalledExactlyOnceWith({ text: '设置', value: 'pages/settings' }, list[2])
  })

  it('点回受控当前项取消待执行切换', async () => {
    const beforeChange = vi.fn()
    const wrapper = mountTabbar({ beforeChange })
    const items = wrapper.findAll('.tabbar__item')
    await items[1].trigger('click')
    await items[0].trigger('click')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 260ms')
    await vi.advanceTimersByTimeAsync(260)

    expect(beforeChange).not.toHaveBeenCalled()
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('translateX(0%)')
  })

  it.each(['false', 'reject'])('切换确认 %s 时回滚视觉选中态', async (result) => {
    const beforeChange = vi.fn(() => result === 'false' ? false : Promise.reject(new Error('拒绝切换')))
    const wrapper = mountTabbar({ beforeChange })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)

    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.findAll('.tabbar__item')[0].classes()).toContain('tabbar__item--active')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
  })

  it('等待确认时忽略重复及其他目标点击', async () => {
    const guard = deferred()
    const beforeChange = vi.fn(() => guard.promise)
    const wrapper = mountTabbar({ beforeChange })
    const items = wrapper.findAll('.tabbar__item')
    await items[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    await items[1].trigger('click')
    await items[2].trigger('click')
    await vi.advanceTimersByTimeAsync(260)

    expect(beforeChange).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('change')).toBeUndefined()
    guard.resolve(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.emitted('change')).toHaveLength(1)
  })

  it('确认期间更新为本次目标仍发出成功事件', async () => {
    const guard = deferred()
    const wrapper = mountTabbar({ beforeChange: () => guard.promise })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    await wrapper.setProps({ value: 'pages/about' })
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
    guard.resolve(true)
    await vi.advanceTimersByTimeAsync(0)

    expect(wrapper.emitted('change')).toHaveLength(1)
    expect(wrapper.findAll('.tabbar__item')[1].classes()).toContain('tabbar__item--active')
  })

  it('调用方未更新受控值时，确认后恢复当前项', async () => {
    const wrapper = mountTabbar({ beforeChange: () => true })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)

    expect(wrapper.emitted('change')).toHaveLength(1)
    expect(wrapper.findAll('.tabbar__item')[0].classes()).toContain('tabbar__item--active')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('translateX(0%)')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
  })

  it('外部选中值更新会取消尚未执行的切换', async () => {
    const beforeChange = vi.fn()
    const wrapper = mountTabbar({ beforeChange })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await wrapper.setProps({ value: 'pages/settings' })
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
    await vi.advanceTimersByTimeAsync(260)

    expect(beforeChange).not.toHaveBeenCalled()
    expect(wrapper.findAll('.tabbar__item')[2].classes()).toContain('tabbar__item--active')
  })

  it('显式取消直接恢复当前项，后续点击仍播放动画', async () => {
    const beforeChange = vi.fn()
    const wrapper = mountTabbar({ beforeChange })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    ;(wrapper.vm as unknown as TabbarAnimatedExpose).cancel()
    await nextTick()

    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('translateX(0%)')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
    await vi.advanceTimersByTimeAsync(260)
    expect(beforeChange).not.toHaveBeenCalled()

    await wrapper.findAll('.tabbar__item')[2].trigger('click')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 260ms')
    await vi.advanceTimersByTimeAsync(260)
    expect(beforeChange).toHaveBeenCalledExactlyOnceWith({ text: '设置', value: 'pages/settings' }, list[2])
  })

  it.each([true, false])('过期确认结果 %s 不覆盖外部选中态', async (accepted) => {
    const guard = deferred()
    const beforeChange = vi.fn(() => guard.promise)
    const wrapper = mountTabbar({ beforeChange })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    await wrapper.setProps({ value: 'pages/settings' })
    await wrapper.findAll('.tabbar__item')[0].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    expect(beforeChange).toHaveBeenCalledTimes(1)

    guard.resolve(accepted)
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.findAll('.tabbar__item')[2].classes()).toContain('tabbar__item--active')
  })

  it.each([true, false])('保留视觉位置取消后，确认结果 %s 不再恢复旧选中项', async (accepted) => {
    const guard = deferred()
    const wrapper = mountTabbar({ beforeChange: () => guard.promise })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    ;(wrapper.vm as unknown as TabbarAnimatedExpose).cancel({ restore: false })
    guard.resolve(accepted)
    await vi.advanceTimersByTimeAsync(0)

    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('translateX(100%)')

    ;(wrapper.vm as unknown as TabbarAnimatedExpose).cancel()
    await nextTick()
    expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
  })

  it('替换列表会取消动画，即使字段值相同', async () => {
    const beforeChange = vi.fn()
    const wrapper = mountTabbar({ beforeChange })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await wrapper.setProps({ list: list.map(item => ({ ...item })) })
    await vi.advanceTimersByTimeAsync(260)

    expect(beforeChange).not.toHaveBeenCalled()
    expect(wrapper.findAll('.tabbar__item')[0].classes()).toContain('tabbar__item--active')
  })

  it('原地删除目标项会取消待执行切换', async () => {
    const items = reactive(list.map(item => ({ ...item })))
    const beforeChange = vi.fn()
    const wrapper = mountTabbar({ list: items, beforeChange })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    items.splice(1, 1)
    await nextTick()
    await vi.advanceTimersByTimeAsync(260)

    expect(beforeChange).not.toHaveBeenCalled()
    expect(wrapper.findAll('.tabbar__item')).toHaveLength(2)
    expect(wrapper.findAll('.tabbar__item')[0].classes()).toContain('tabbar__item--active')
  })

  it('卸载时取消尚未执行的切换，并清理当前平台的动态效果监听', async () => {
    const { media } = mockMotion(false)
    const beforeChange = vi.fn()
    const wrapper = mountTabbar({ beforeChange })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(260)

    expect(beforeChange).not.toHaveBeenCalled()
    expect(media.addEventListener).toHaveBeenCalledTimes(isH5 ? 1 : 0)
    expect(media.removeEventListener).toHaveBeenCalledTimes(isH5 ? 1 : 0)
  })

  it('卸载后忽略已经发出的确认结果', async () => {
    const guard = deferred()
    const beforeChange = vi.fn(() => guard.promise)
    const wrapper = mountTabbar({ beforeChange })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    wrapper.unmount()
    guard.resolve(true)
    await vi.advanceTimersByTimeAsync(0)

    expect(beforeChange).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('停用缓存组件时取消动画，恢复后仍能切换', async () => {
    const shown = shallowRef(true)
    const beforeChange = vi.fn(() => true)
    const wrapper = mount(defineComponent({
      setup: () => () => h(KeepAlive, {}, () => shown.value
        ? h(TabbarAnimated<Item>, { height: 50, list, value: 'pages/index', valueField: 'pagePath', beforeChange })
        : null),
    }))
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    shown.value = false
    await nextTick()
    await vi.advanceTimersByTimeAsync(260)
    expect(beforeChange).not.toHaveBeenCalled()

    shown.value = true
    await nextTick()
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('translateX(0%)')
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    expect(beforeChange).toHaveBeenCalledTimes(1)
  })

  it.runIf(isH5)('减少动态效果时 CSS 与切换请求都不等待', async () => {
    mockMotion(true)
    const beforeChange = vi.fn(() => true)
    const wrapper = mountTabbar({ beforeChange })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')

    expect(beforeChange).toHaveBeenCalledOnce()
    expect(wrapper.emitted('change')).toHaveLength(1)
    expect(wrapper.find('.animated-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
  })

  it.runIf(isH5)('动画期间开启减少动态效果会立即完成等待', async () => {
    const { setReduced } = mockMotion(false)
    const beforeChange = vi.fn(() => true)
    const wrapper = mountTabbar({ beforeChange })
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    setReduced(true)
    await nextTick()

    expect(beforeChange).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(260)
    expect(beforeChange).toHaveBeenCalledOnce()
  })

  it('空列表不显示指示器', () => {
    const wrapper = mountTabbar({ list: [] })
    expect(wrapper.find('.animated-tabbar__indicator').exists()).toBe(false)
  })
})
