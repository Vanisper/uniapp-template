import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, shallowRef } from 'vue'
import { useLayout } from './index'

const mocks = vi.hoisted(() => ({
  usePageRoute: vi.fn<() => string | undefined>(),
}))

vi.mock('../usePageRoute', () => ({ usePageRoute: mocks.usePageRoute }))
vi.mock('@/configs/theme', () => ({
  THEME_CONFIG: {
    navbar: { height: 48 },
    tabbar: { mode: 'custom', height: 56 },
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
    navbarHeight: layout.navbarHeight.value,
    tabbarHeight: layout.tabbarHeight.value,
    pageHeight: layout.pageHeight.value,
    pageWrapperStyle: layout.pageWrapperStyle.value,
  }
}

beforeEach(() => {
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
  it('两个缓存 tab 页和普通页各自保留导航栏、底栏及占位，活动页切换不改变旧页面', async () => {
    const layouts = [
      createLayout('pages/index'),
      createLayout('pages/about'),
      createLayout('pages/detail'),
    ]
    const initialLayouts = layouts.map(readLayout)

    expect(initialLayouts).toMatchObject([
      { hasNavbar: true, hasTabbar: true, navbarHeight: 48, tabbarHeight: 56 },
      { hasNavbar: false, hasTabbar: true, navbarHeight: 44, tabbarHeight: 56 },
      { hasNavbar: true, hasTabbar: false, navbarHeight: 48, tabbarHeight: 0 },
    ])
    expect(initialLayouts[2]!.pageHeight).toBeGreaterThan(initialLayouts[0]!.pageHeight)

    for (const route of ['pages/about', 'pages/detail', 'pages/index']) {
      activeRoute.value = route
      await nextTick()

      expect(layouts.map(readLayout)).toEqual(initialLayouts)
    }
  })
})
