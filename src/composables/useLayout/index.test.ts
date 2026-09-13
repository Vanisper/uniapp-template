import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import { useLayout } from './index'

const mocks = vi.hoisted(() => ({
  usePageRoute: vi.fn<() => string | undefined>(),
  tabbar: { mode: 'custom' as 'custom' | 'default', height: 56 },
}))

vi.mock('../usePageRoute', () => ({ usePageRoute: mocks.usePageRoute }))
vi.mock('@/configs/theme', () => ({
  THEME_CONFIG: {
    navbar: { height: 48 },
    tabbar: mocks.tabbar,
  },
}))

const pageOptions: Record<string, { tabbar: boolean, customNavigation: boolean }> = {
  'pages/index': { tabbar: true, customNavigation: true },
  'pages/about': { tabbar: true, customNavigation: false },
  'pages/detail': { tabbar: false, customNavigation: true },
}

let activeRoute = shallowRef('pages/index')

function createLayout(route: string) {
  mocks.usePageRoute.mockReturnValue(route)
  return useLayout()
}

function readLayout(layout: ReturnType<typeof useLayout>) {
  return {
    hasNavbar: layout.hasNavbar.value,
    hasTabbar: layout.hasTabbar.value,
    hasNativeTabbar: layout.hasNativeTabbar.value,
    navbarHeight: layout.navbarHeight.value,
    tabbarHeight: layout.tabbarHeight.value,
    pageHeight: layout.pageHeight.value,
    pageWrapperStyle: layout.pageWrapperStyle.value,
  }
}

beforeEach(() => {
  mocks.tabbar.mode = 'custom'
  activeRoute = shallowRef('pages/index')
  vi.stubGlobal('usePages', () => ({
    currentRoute: activeRoute,
    isCustomNavigationStyle: (route: string) => pageOptions[route]?.customNavigation ?? false,
    isTabBarPage: (route: string) => pageOptions[route]?.tabbar ?? false,
  }))
  vi.stubGlobal('useWindowInfo', () => ({
    safeBottom: shallowRef(800),
    statusBarHeight: shallowRef(24),
  }))
  vi.stubGlobal('uni', {
    getMenuButtonBoundingClientRect: () => ({ top: 32, height: 28 }),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('页面布局归属', () => {
  it.each(['custom', 'default'] as const)('%s 模式下，缓存 tab 页和普通页各自保留布局，活动页切换不改变旧页面', async (mode) => {
    mocks.tabbar.mode = mode
    const custom = mode === 'custom'
    const layouts = [
      createLayout('pages/index'),
      createLayout('pages/about'),
      createLayout('pages/detail'),
    ]
    const initialLayouts = layouts.map(readLayout)

    expect(initialLayouts).toMatchObject([
      { hasNavbar: true, hasTabbar: custom, hasNativeTabbar: !custom, navbarHeight: 48, tabbarHeight: custom ? 56 : 0 },
      { hasNavbar: false, hasTabbar: custom, hasNativeTabbar: !custom, navbarHeight: 44, tabbarHeight: custom ? 56 : 0 },
      { hasNavbar: true, hasTabbar: false, hasNativeTabbar: false, navbarHeight: 48, tabbarHeight: 0 },
    ])
    expect(initialLayouts[2]!.pageHeight - initialLayouts[0]!.pageHeight).toBe(custom ? 56 : 0)

    for (const route of ['pages/about', 'pages/detail', 'pages/index']) {
      activeRoute.value = route
      await nextTick()

      expect(layouts.map(readLayout)).toEqual(initialLayouts)
    }
  })
})
