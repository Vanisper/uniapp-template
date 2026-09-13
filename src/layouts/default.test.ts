import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DefaultLayout from './default.vue'

const mocks = vi.hoisted(() => ({
  useLayout: vi.fn(),
  usePageRoute: vi.fn(),
  goBack: vi.fn(),
  goHome: vi.fn(),
}))

vi.mock('@/components/App/PageTabbar.vue', () => ({ default: { template: '<view />' } }))
vi.mock('@/composables/useLayout', () => ({ useLayout: mocks.useLayout }))
vi.mock('@/composables/usePageRoute', () => ({ usePageRoute: mocks.usePageRoute }))

let wrapper: ReturnType<typeof mount> | undefined

beforeEach(() => {
  mocks.usePageRoute.mockReturnValue('pages/index')
  mocks.useLayout.mockReturnValue({
    hasNavbar: true,
    hasTabbar: true,
    navbarHeight: 44,
    tabbarHeight: 50,
    statusBarHeight: 20,
  })
  vi.stubGlobal('usePages', () => ({
    goBack: mocks.goBack,
    goHome: mocks.goHome,
    isTabBarPage: (route: string) => ['pages/index', 'pages/about'].includes(route),
    getNavigationBarTitleText: () => '页面标题',
  }))
  vi.stubGlobal('useTheme', () => ({
    navigationBarColor: { backgroundColor: '#ffffff', frontColor: '#000000' },
  }))
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllGlobals()
})

describe('默认布局导航', () => {
  it.each(['pages/index', 'pages/about'])('%s 根页面不显示返回和首页按钮', (route) => {
    mocks.usePageRoute.mockReturnValue(route)
    wrapper = mount(DefaultLayout)

    expect(wrapper.text()).toContain('页面标题')
    expect(wrapper.find('[i-carbon\\:chevron-left]').exists()).toBe(false)
    expect(wrapper.find('[i-carbon\\:home]').exists()).toBe(false)
  })

  it('子页面保留返回按钮，返回失败时使用首页兜底', async () => {
    mocks.usePageRoute.mockReturnValue('pages/test')
    wrapper = mount(DefaultLayout)

    await wrapper.find('[i-carbon\\:chevron-left]').trigger('click')

    expect(mocks.goBack).toHaveBeenCalledExactlyOnceWith(true)
    expect(mocks.goHome).not.toHaveBeenCalled()
  })

  it('子页面可以直接返回首页', async () => {
    mocks.usePageRoute.mockReturnValue('pages/test')
    wrapper = mount(DefaultLayout)

    await wrapper.find('[i-carbon\\:home]').trigger('click')

    expect(mocks.goHome).toHaveBeenCalledExactlyOnceWith()
    expect(mocks.goBack).not.toHaveBeenCalled()
  })

  it('使用原生导航栏时不额外显示自定义导航', () => {
    mocks.usePageRoute.mockReturnValue('pages/test')
    mocks.useLayout.mockReturnValue({ hasNavbar: false, hasTabbar: false })
    wrapper = mount(DefaultLayout)

    expect(wrapper.text()).not.toContain('页面标题')
    expect(wrapper.find('[i-carbon\\:chevron-left]').exists()).toBe(false)
    expect(wrapper.find('[i-carbon\\:home]').exists()).toBe(false)
  })
})
