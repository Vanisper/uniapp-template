import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, inject, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import AppPageTabbar from './PageTabbar.vue'

const isWeixin = inject('uniPlatform') === 'mp-weixin'

const mocks = vi.hoisted(() => ({
  usePages: vi.fn(),
  usePageRoute: vi.fn(),
  go: vi.fn(),
  show: [] as (() => void)[],
  hide: [] as (() => void)[],
  config: { tabbar: { height: 72 } },
}))

vi.mock('@dcloudio/uni-app', () => ({
  onShow: (callback: () => void) => mocks.show.push(callback),
  onHide: (callback: () => void) => mocks.hide.push(callback),
}))
vi.mock('@/composables/usePages', () => ({ usePages: mocks.usePages }))
vi.mock('@/composables/usePageRoute', () => ({ usePageRoute: mocks.usePageRoute }))
vi.mock('@/configs/theme', () => ({ THEME_CONFIG: mocks.config }))

const list = [
  { text: '首页', pagePath: 'pages/index', iconPath: 'static/home.png', selectedIconPath: 'static/home-active.png' },
  { text: '关于', pagePath: 'pages/about', iconPath: 'static/about.png', selectedIconPath: 'static/about-active.png' },
]
let wrapper: ReturnType<typeof mount> | undefined
let currentRoute = shallowRef('pages/index')
const showToast = vi.fn()

function mockAppRouteDone(available = true) {
  type Handler = (event: { path: string }) => void
  const handlers = new Set<Handler>()
  const canIUse = vi.fn(() => available)
  const onAppRouteDone = vi.fn((handler: Handler) => {
    handlers.add(handler)
  })
  const offAppRouteDone = vi.fn((handler: Handler) => {
    handlers.delete(handler)
  })
  vi.stubGlobal('wx', { canIUse, onAppRouteDone, offAppRouteDone })
  return {
    canIUse,
    onAppRouteDone,
    offAppRouteDone,
    emit(path: string) {
      handlers.forEach(handler => handler({ path }))
    },
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  currentRoute = shallowRef('pages/index')
  mocks.usePageRoute.mockImplementation(() => currentRoute.value)
  mocks.show.length = 0
  mocks.hide.length = 0
  mocks.go.mockReset()
  mocks.go.mockImplementation(async (route: string) => {
    currentRoute.value = route
    return true
  })
  mocks.usePages.mockReturnValue({
    getCurrentPage: () => ({ route: currentRoute.value }),
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
  it('按编译平台管理原生底栏与微信转场监听', async () => {
    const routeDone = mockAppRouteDone()
    wrapper = mount(AppPageTabbar)

    expect(uni.hideTabBar).toHaveBeenCalledTimes(isWeixin ? 0 : 1)
    expect(routeDone.onAppRouteDone).toHaveBeenCalledTimes(isWeixin ? 1 : 0)

    mocks.show.forEach(callback => callback())
    await nextTick()

    expect(uni.hideTabBar).toHaveBeenCalledTimes(isWeixin ? 0 : 2)
    expect(routeDone.onAppRouteDone).toHaveBeenCalledTimes(isWeixin ? 1 : 0)
  })

  it('缓存页离场允许保留目标，所属页显示时独立复位', async () => {
    wrapper = mount(AppPageTabbar)
    const homeShow = [...mocks.show]
    const homeHide = [...mocks.hide]
    mocks.go.mockImplementation(async (route: string) => {
      homeHide.forEach(callback => callback())
      currentRoute.value = route
      return true
    })

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)

    const about = mount(AppPageTabbar)
    const aboutShow = mocks.show.slice(homeShow.length)
    const aboutHide = mocks.hide.slice(homeHide.length)
    try {
      expect(about.find('.tabbar__item--active').text()).toBe('关于')
      expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')

      mocks.go.mockImplementation(async (route: string) => {
        aboutHide.forEach(callback => callback())
        currentRoute.value = route
        return true
      })
      await about.findAll('.tabbar__item')[0].trigger('click')
      await vi.advanceTimersByTimeAsync(260)

      expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')
      expect(about.find('.tabbar__item--active').text()).toBe('首页')

      homeShow.forEach(callback => callback())
      await nextTick()
      expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')
      expect(about.find('.tabbar__item--active').text()).toBe('首页')
      expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(0%)')
      expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')

      currentRoute.value = 'pages/about'
      aboutShow.forEach(callback => callback())
      await nextTick()
      expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')
      expect(about.find('.tabbar__item--active').text()).toBe('关于')
      expect(about.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(100%)')
      expect(about.find('.raised-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
    }
    finally {
      about.unmount()
    }
  })

  it('关于页首次挂载时直接选中所属页，不等待活动路由更新', () => {
    mocks.usePageRoute.mockReturnValue('pages/about')
    wrapper = mount(AppPageTabbar)

    expect(currentRoute.value).toBe('pages/index')
    expect(wrapper.findAll('.tabbar__item--active')).toHaveLength(1)
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')
    expect(mocks.go).not.toHaveBeenCalled()
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(100%)')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
  })

  it('同页导航只触发 onHide 时仍保留底栏，并可继续切换', async () => {
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
    await vi.advanceTimersByTimeAsync(260)

    expect(showToast).toHaveBeenCalledWith({ title: '切换失败，请重试', icon: 'none' })
  })

  it('将页面配置的路径、文案与图标交给抬起底栏，并采用配置高度', async () => {
    wrapper = mount(AppPageTabbar)

    expect(wrapper.find('.raised-tabbar').exists()).toBe(true)
    expect(wrapper.find('.tabbar-placeholder').attributes('style')).toContain('height: 72px')
    expect(wrapper.findAll('.tabbar__item').map(item => item.text())).toEqual(['首页', '关于'])
    expect(wrapper.findAll('.raised-tabbar__icon').map(icon => icon.attributes('src'))).toEqual([
      '/static/home-active.png',
      '/static/about.png',
    ])

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    expect(wrapper.findAll('.raised-tabbar__icon').map(icon => icon.attributes('src'))).toEqual([
      '/static/home.png',
      '/static/about-active.png',
    ])
    await vi.advanceTimersByTimeAsync(260)

    expect(mocks.go).toHaveBeenCalledExactlyOnceWith('pages/about', true)
  })

  it('凹槽过渡结束后导航一次，不重复消费 change 事件', async () => {
    wrapper = mount(AppPageTabbar)

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    expect(mocks.go).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(260)

    expect(mocks.go).toHaveBeenCalledExactlyOnceWith('pages/about', true)
    expect(currentRoute.value).toBe('pages/about')
    expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')
  })

  it('动画导航隐藏时保留目标选中态，重新显示所属页时无动画复位', async () => {
    let settle!: (succeeded: boolean) => void
    mocks.go.mockReturnValue(new Promise<boolean>((resolve) => {
      settle = resolve
    }))
    wrapper = mount(AppPageTabbar)

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    expect(mocks.go).toHaveBeenCalledExactlyOnceWith('pages/about', true)
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')

    mocks.hide.forEach(callback => callback())
    await nextTick()

    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(100%)')

    currentRoute.value = 'pages/about'
    settle(true)
    await vi.advanceTimersByTimeAsync(0)

    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(100%)')

    currentRoute.value = 'pages/index'
    mocks.show.forEach(callback => callback())
    await nextTick()

    expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(0%)')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
  })

  it.runIf(isWeixin)('微信转场完成后立即复位隐藏缓存页，导航 API 成功时仍保留离场目标', async () => {
    const routeDone = mockAppRouteDone()
    let settle!: (succeeded: boolean) => void
    mocks.go.mockReturnValue(new Promise<boolean>((resolve) => {
      settle = resolve
    }))
    wrapper = mount(AppPageTabbar)

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    mocks.hide.forEach(callback => callback())
    await nextTick()
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(100%)')

    currentRoute.value = 'pages/about'
    settle(true)
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(100%)')

    routeDone.emit('pages/settings')
    await nextTick()
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')

    routeDone.emit('pages/about')
    await nextTick()
    expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(0%)')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
  })

  it.runIf(isWeixin)('微信其他页面的迟到转场事件不打断重新显示后开始的新预选', async () => {
    const routeDone = mockAppRouteDone()
    mocks.go.mockImplementationOnce(async (route: string) => {
      mocks.hide.forEach(callback => callback())
      currentRoute.value = route
      return true
    })
    wrapper = mount(AppPageTabbar)

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    currentRoute.value = 'pages/index'
    mocks.show.forEach(callback => callback())
    await nextTick()
    expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(100)
    routeDone.emit('pages/about')
    await nextTick()
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(100%)')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('transition-duration: 260ms')
    expect(mocks.go).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(160)
    expect(mocks.go).toHaveBeenCalledTimes(2)
  })

  it.runIf(isWeixin)('微信转场监听在卸载时用同一函数取消', () => {
    const routeDone = mockAppRouteDone()
    wrapper = mount(AppPageTabbar)
    expect(routeDone.onAppRouteDone).toHaveBeenCalledOnce()
    const handler = routeDone.onAppRouteDone.mock.calls[0]![0]

    wrapper.unmount()
    wrapper = undefined

    expect(routeDone.offAppRouteDone).toHaveBeenCalledExactlyOnceWith(handler)
  })

  it.runIf(isWeixin)('微信转场 API 不可用时仍在所属页显示时恢复选中态', async () => {
    const routeDone = mockAppRouteDone(false)
    mocks.go.mockImplementation(async (route: string) => {
      mocks.hide.forEach(callback => callback())
      currentRoute.value = route
      return true
    })
    wrapper = mount(AppPageTabbar)

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    routeDone.emit('pages/about')
    await nextTick()
    expect(routeDone.onAppRouteDone).not.toHaveBeenCalled()
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')

    currentRoute.value = 'pages/index'
    mocks.show.forEach(callback => callback())
    await nextTick()
    expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(0%)')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
  })

  it('导航失败时回到所属页选中项，并允许重试', async () => {
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

  it('动画导航隐藏后失败时无需再次显示即可恢复选中态并重试', async () => {
    let settle!: (succeeded: boolean) => void
    mocks.go.mockReturnValueOnce(new Promise<boolean>((resolve) => {
      settle = resolve
    }))
    wrapper = mount(AppPageTabbar)

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    expect(mocks.go).toHaveBeenCalledExactlyOnceWith('pages/about', true)

    mocks.hide.forEach(callback => callback())
    await nextTick()
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')

    settle(false)
    await vi.advanceTimersByTimeAsync(0)

    expect(currentRoute.value).toBe('pages/index')
    expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('translateX(0%)')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('transition-duration: 0ms')
    expect(showToast).not.toHaveBeenCalled()

    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    expect(wrapper.find('.tabbar__item--active').text()).toBe('关于')
    expect(wrapper.find('.raised-tabbar__indicator').attributes('style')).toContain('transition-duration: 260ms')
    await vi.advanceTimersByTimeAsync(260)
    expect(mocks.go).toHaveBeenCalledTimes(2)
    expect(currentRoute.value).toBe('pages/about')
  })

  it('页面隐藏时取消动画，底栏展示继续由页面容器控制', async () => {
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
    expect(wrapper.find('.tabbar__item--active').text()).toBe('首页')
  })

  it('页面隐藏会使进行中导航的失败提示失效', async () => {
    let settle!: (succeeded: boolean) => void
    mocks.go.mockReturnValue(new Promise<boolean>((resolve) => {
      settle = resolve
    }))
    wrapper = mount(AppPageTabbar)
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    expect(mocks.go).toHaveBeenCalledExactlyOnceWith('pages/about', true)

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
    await vi.advanceTimersByTimeAsync(260)
    await target.trigger('click')
    await wrapper.findAll('.tabbar__item')[0].trigger('click')
    await vi.advanceTimersByTimeAsync(260)
    expect(mocks.go).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    wrapper = undefined
    settle(false)
    await vi.advanceTimersByTimeAsync(0)
    expect(showToast).not.toHaveBeenCalled()
  })

  it('过渡结束前卸载会取消尚未发出的页面跳转', async () => {
    wrapper = mount(AppPageTabbar)
    await wrapper.findAll('.tabbar__item')[1].trigger('click')
    await vi.advanceTimersByTimeAsync(100)

    wrapper.unmount()
    wrapper = undefined
    await vi.advanceTimersByTimeAsync(260)

    expect(mocks.go).not.toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
  })
})
