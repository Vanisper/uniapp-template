import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import AppPageTabbar from './PageTabbar.vue'

const mocks = vi.hoisted(() => ({
  usePages: vi.fn(),
  go: vi.fn(),
  show: [] as (() => void)[],
  hide: [] as (() => void)[],
  config: { tabbar: { height: 50, variant: 'basic' as 'basic' | 'animated' } },
}))

vi.mock('@dcloudio/uni-app', () => ({
  onShow: (callback: () => void) => mocks.show.push(callback),
  onHide: (callback: () => void) => mocks.hide.push(callback),
}))
vi.mock('@/composables/usePages', () => ({ usePages: mocks.usePages }))
vi.mock('@/configs/theme', () => ({ THEME_CONFIG: mocks.config }))

const list = [
  { text: '首页', pagePath: 'pages/index' },
  { text: '关于', pagePath: 'pages/about' },
]
let wrapper: ReturnType<typeof mount> | undefined
let currentRoute = shallowRef('pages/index')
const showToast = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  currentRoute = shallowRef('pages/index')
  mocks.config.tabbar.variant = 'basic'
  mocks.show.length = 0
  mocks.hide.length = 0
  mocks.go.mockReset()
  mocks.go.mockImplementation(async (route: string) => {
    currentRoute.value = route
    return true
  })
  mocks.usePages.mockReturnValue({
    currentRoute,
    go: mocks.go,
    pagesJson: { tabBar: { list } },
  })
  vi.stubGlobal('uni', { hideTabBar: vi.fn(), showToast })
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('页面 TabBar 接入', () => {
  it.each(['basic', 'animated'] as const)('%s 同页导航只触发 onHide 时仍保留底栏，并可继续切换', async (variant) => {
    mocks.config.tabbar.variant = variant
    wrapper = mount(AppPageTabbar)

    mocks.hide.forEach(callback => callback())
    await nextTick()

    expect(wrapper.findAll('.tabbar__item')).toHaveLength(2)
    expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    expect(mocks.go).toHaveBeenCalledExactlyOnceWith('pages/about', true)
  })

  it('孤立的 onHide 不会屏蔽后续导航的失败提示', async () => {
    mocks.go.mockResolvedValue(false)
    wrapper = mount(AppPageTabbar)
    mocks.hide.forEach(callback => callback())
    await nextTick()

    await wrapper.findAll('.tabbar__item')[1].trigger('click')

    expect(showToast).toHaveBeenCalledWith({ title: '切换失败，请重试', icon: 'none' })
  })

  it('基础版立即导航，活动项仍由真实路由驱动', async () => {
    wrapper = mount(AppPageTabbar)

    await wrapper.findAll('.tabbar__item')[1].trigger('click')

    expect(mocks.go).toHaveBeenCalledExactlyOnceWith('pages/about', true)
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')
  })

  it('动画版在过渡结束后导航一次，不重复消费 change 事件', async () => {
    mocks.config.tabbar.variant = 'animated'
    wrapper = mount(AppPageTabbar)

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    expect(mocks.go).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(260)

    expect(mocks.go).toHaveBeenCalledExactlyOnceWith('pages/about', true)
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')
  })

  it('导航失败时动画版回到真实选中项，并允许重试', async () => {
    mocks.config.tabbar.variant = 'animated'
    mocks.go.mockResolvedValue(false)
    wrapper = mount(AppPageTabbar)

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)

    expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')
    expect(showToast).toHaveBeenCalledWith({ title: '切换失败，请重试', icon: 'none' })

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    expect(mocks.go).toHaveBeenCalledTimes(2)
  })

  it('页面隐藏时取消动画，底栏展示继续由页面容器控制', async () => {
    mocks.config.tabbar.variant = 'animated'
    wrapper = mount(AppPageTabbar)
    await wrapper.findAll('.tabbar__item')[1].trigger('click')

    mocks.hide.forEach(callback => callback())
    await nextTick()
    await vi.advanceTimersByTimeAsync(260)
    expect(mocks.go).not.toHaveBeenCalled()
    expect(wrapper.findAll('.tabbar__item')).toHaveLength(2)
    expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')

    currentRoute.value = 'pages/about'
    mocks.show.forEach(callback => callback())
    await nextTick()
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')
  })

  it('页面隐藏会使进行中导航的失败提示失效', async () => {
    let settle!: (succeeded: boolean) => void
    mocks.go.mockReturnValue(new Promise<boolean>((resolve) => {
      settle = resolve
    }))
    wrapper = mount(AppPageTabbar)
    await wrapper.findAll('.tabbar__item')[1].trigger('click')

    mocks.hide.forEach(callback => callback())
    settle(false)
    await vi.advanceTimersByTimeAsync(0)

    expect(showToast).not.toHaveBeenCalled()
  })

  it('导航进行中不重复提交，卸载后不显示迟到的失败提示', async () => {
    let settle!: (succeeded: boolean) => void
    mocks.go.mockReturnValue(new Promise<boolean>((resolve) => {
      settle = resolve
    }))
    wrapper = mount(AppPageTabbar)
    const target = wrapper.findAll('.tabbar__item')[1]
    await target.trigger('click')
    await target.trigger('click')
    expect(mocks.go).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    wrapper = undefined
    settle(false)
    await vi.advanceTimersByTimeAsync(0)
    expect(showToast).not.toHaveBeenCalled()
  })
})
