import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/pages.json', () => ({
  default: {
    globalStyle: {},
    pages: [
      { path: 'pages/index' },
      { path: 'pages/about' },
    ],
    tabBar: {
      list: [
        { pagePath: 'pages/index', text: '首页' },
        { pagePath: 'pages/about', text: '关于' },
      ],
    },
  },
}))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('usePages', () => {
  it('显式同步后重新读取当前页面栈', async () => {
    const pageStack: any[] = [{ options: {}, route: 'pages/index' }]
    vi.stubGlobal('getCurrentPages', () => pageStack)
    const { usePages } = await import('./usePages')

    const { currentPage, syncPageStack } = usePages()
    expect(currentPage.value.route).toBe('pages/index')

    pageStack[0] = { options: {}, route: 'pages/about' }
    syncPageStack()

    expect(currentPage.value.route).toBe('pages/about')
  })

  it('等待路由完成后交替切换仍保持目标路由与活动状态', async () => {
    const pageStack: any[] = [{ options: {}, route: 'pages/index' }]
    const switchTab = vi.fn()
    vi.stubGlobal('getCurrentPages', () => pageStack)
    vi.stubGlobal('uni', { switchTab })
    const { usePages } = await import('./usePages')

    const firstLayout = usePages()
    firstLayout.go('pages/about', true)

    expect(firstLayout.currentTabbarPath.value).toBe('pages/about')
    expect(firstLayout.currentRoute.value).toBe('pages/about')

    pageStack[0] = { options: {}, route: 'pages/about' }
    const secondLayout = usePages()
    secondLayout.syncPageStack()
    secondLayout.go('pages/index', true)

    expect(secondLayout.currentTabbarPath.value).toBe('pages/index')
    expect(secondLayout.currentRoute.value).toBe('pages/index')
    expect(switchTab).toHaveBeenCalledTimes(2)
  })

  it('切换 tab 时不枚举页面组件实例', async () => {
    const page = new Proxy({ options: {}, route: 'pages/index' }, {
      ownKeys() {
        throw new Error('不应枚举页面组件实例')
      },
    })
    vi.stubGlobal('getCurrentPages', () => [page])
    vi.stubGlobal('uni', { switchTab: vi.fn() })
    const { usePages } = await import('./usePages')

    const layout = usePages()
    layout.go('pages/about', true)

    expect(() => layout.currentPage.value.route).not.toThrow()
    expect(layout.currentTabbarPath.value).toBe('pages/about')
  })

  it('切换失败时恢复原 tab 路由', async () => {
    const pageStack: any[] = [{ options: {}, route: 'pages/index' }]
    const switchTab = vi.fn((options: any) => {
      options.fail(new Error('切换失败'))
    })
    vi.stubGlobal('getCurrentPages', () => pageStack)
    vi.stubGlobal('uni', { switchTab })
    const { usePages } = await import('./usePages')

    const layout = usePages()

    expect(() => layout.go('pages/about', true)).toThrow('切换失败')
    expect(layout.currentTabbarPath.value).toBe('pages/index')
    expect(switchTab.mock.calls.map(([options]) => options.url)).toEqual([
      'pages/about',
      '/pages/about',
    ])
  })
})
