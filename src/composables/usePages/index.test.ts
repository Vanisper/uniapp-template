import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/pages.json', () => ({
  default: {
    globalStyle: { navigationBarTitleText: '应用', navigationStyle: 'custom' },
    pages: [
      { path: 'pages/index', type: 'home', style: { navigationBarTitleText: '首页' } },
      { path: 'pages/about' },
      { path: 'pages/detail', style: { navigationStyle: 'default' } },
    ],
    tabBar: {
      list: [
        { pagePath: 'pages/index', text: '首页' },
        { pagePath: 'pages/about', text: '关于' },
      ],
    },
  },
}))

interface NavigationOptions {
  url?: string
  success?: (result: { errMsg: string }) => void
  fail?: (result: { errMsg: string }) => void
}

function createRuntime() {
  const pageStack = [{ options: {}, route: 'pages/index' }]
  const requests: { method: string, options: NavigationOptions }[] = []
  const navigate = (method: string) => vi.fn((options: NavigationOptions) => {
    requests.push({ method, options })
  })
  const uni = {
    navigateTo: navigate('navigateTo'),
    switchTab: navigate('switchTab'),
    navigateBack: navigate('navigateBack'),
  }

  function finish(index: number, success: boolean, route?: string) {
    const { method, options } = requests[index]!
    if (route !== undefined) {
      pageStack.splice(0, pageStack.length, { options: {}, route })
    }
    const result = { errMsg: `${method}:${success ? 'ok' : 'fail'}` }
    if (success) {
      options.success?.(result)
    }
    else {
      options.fail?.(result)
    }
  }

  vi.stubGlobal('getCurrentPages', () => pageStack)
  vi.stubGlobal('uni', uni)
  return { pageStack, requests, uni, finish }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('usePages', () => {
  it('启动时页面栈为空也能安全查询', async () => {
    const { pageStack } = createRuntime()
    pageStack.length = 0
    const { usePages } = await import('./index')
    const pages = usePages()

    expect(pages.getCurrentPage()).toBeUndefined()
    expect(pages.isTabBarPage('')).toBe(false)

    pageStack.push({ options: {}, route: 'pages/index' })

    expect(pages.getCurrentPage()?.route).toBe('pages/index')
  })

  it('同一调用方在外部页面栈变化后直接查询到新页面及配置', async () => {
    const { pageStack } = createRuntime()
    const { usePages } = await import('./index')
    const first = usePages()
    const second = usePages()
    expect(first.getCurrentPage()?.route).toBe('pages/index')
    expect(second.getCurrentPage()?.route).toBe('pages/index')

    pageStack[0] = { options: {}, route: 'pages/about' }

    expect(first.getCurrentPage()?.route).toBe('pages/about')
    expect(second.getCurrentPage()?.route).toBe('pages/about')
    expect(second.getCurrentPage()?.navigationBarTitleText).toBe('应用')
    expect(second.getNavigationBarTitleText('pages/index')).toBe('首页')
    expect(second.isCustomNavigationStyle('pages/detail')).toBe(false)
  })

  it('读取页面时不枚举组件实例', async () => {
    const { pageStack } = createRuntime()
    pageStack[0] = new Proxy(pageStack[0]!, {
      ownKeys() {
        throw new Error('不应枚举页面组件实例')
      },
    })
    const { usePages } = await import('./index')

    expect(usePages().getCurrentPage()?.route).toBe('pages/index')
  })

  it('导航前后查询真实页面栈', async () => {
    const runtime = createRuntime()
    const { usePages } = await import('./index')
    const pages = usePages()
    const result = pages.go('pages/about', true)

    expect(pages.getCurrentPage()?.route).toBe('pages/index')
    expect(runtime.requests[0]).toMatchObject({ method: 'switchTab', options: { url: '/pages/about' } })
    runtime.finish(0, true, 'pages/about')

    await expect(result).resolves.toBe(true)
    expect(pages.getCurrentPage()?.route).toBe('pages/about')
  })

  it('导航 API 先成功时查询仍遵守真实页面栈', async () => {
    const runtime = createRuntime()
    const { usePages } = await import('./index')
    const pages = usePages()
    const result = pages.go('pages/about', true)
    runtime.finish(0, true)

    await expect(result).resolves.toBe(true)
    expect(pages.getCurrentPage()?.route).toBe('pages/index')

    runtime.pageStack[0] = { options: {}, route: 'pages/about' }

    expect(pages.getCurrentPage()?.route).toBe('pages/about')
  })

  it('导航失败返回 false 且不改变真实路由', async () => {
    const runtime = createRuntime()
    const { usePages } = await import('./index')
    const pages = usePages()
    const result = pages.go('/pages/about', true)
    runtime.finish(0, false)

    await expect(result).resolves.toBe(false)
    expect(pages.getCurrentPage()?.route).toBe('pages/index')
    expect(runtime.requests).toHaveLength(1)
  })

  it('同步抛出的导航错误也转换为 false', async () => {
    const { uni } = createRuntime()
    uni.navigateTo.mockImplementation(() => {
      throw new Error('平台导航失败')
    })
    const { usePages } = await import('./index')

    await expect(usePages().go('pages/detail')).resolves.toBe(false)
  })

  it('普通页面使用根路径导航并保留查询参数', async () => {
    const runtime = createRuntime()
    const { usePages } = await import('./index')
    const pages = usePages()
    const result = pages.go('/pages/detail?id=3')
    expect(runtime.requests[0]).toMatchObject({ method: 'navigateTo', options: { url: '/pages/detail?id=3' } })

    runtime.finish(0, true, 'pages/detail')

    await expect(result).resolves.toBe(true)
    expect(pages.getCurrentPage()?.route).toBe('pages/detail')
  })

  it('较早导航的晚到失败不能覆盖后来成功的真实路由', async () => {
    const runtime = createRuntime()
    const { usePages } = await import('./index')
    const pages = usePages()
    const first = pages.go('pages/about', true)
    const second = pages.go('pages/detail')
    runtime.finish(1, true, 'pages/detail')
    await expect(second).resolves.toBe(true)
    runtime.finish(0, false)

    await expect(first).resolves.toBe(false)
    expect(pages.getCurrentPage()?.route).toBe('pages/detail')
  })

  it('返回 API 先成功时查询仍遵守真实页面栈', async () => {
    const runtime = createRuntime()
    runtime.pageStack.push({ options: {}, route: 'pages/detail' })
    const { usePages } = await import('./index')
    const pages = usePages()
    expect(pages.getCurrentPage()?.route).toBe('pages/detail')
    const result = pages.goBack()
    expect(runtime.requests[0]?.method).toBe('navigateBack')
    runtime.finish(0, true)

    await expect(result).resolves.toBe(true)
    expect(pages.getCurrentPage()?.route).toBe('pages/detail')

    runtime.pageStack.pop()

    expect(pages.getCurrentPage()?.route).toBe('pages/index')
  })

  it.each([
    { initialLength: 1, currentLength: 2, method: 'navigateBack' },
    { initialLength: 2, currentLength: 1, method: 'switchTab' },
  ])('返回时按最新的 $currentLength 页栈决定是否使用首页兜底', async ({ initialLength, currentLength, method }) => {
    const runtime = createRuntime()
    if (initialLength === 2) {
      runtime.pageStack.push({ options: {}, route: 'pages/detail' })
    }
    const { usePages } = await import('./index')
    const pages = usePages()
    expect(pages.getCurrentPage()?.route).toBe(initialLength === 2 ? 'pages/detail' : 'pages/index')

    if (currentLength === 2) {
      runtime.pageStack.push({ options: {}, route: 'pages/detail' })
    }
    else {
      runtime.pageStack.pop()
    }
    const result = pages.goBack(true)

    expect(runtime.requests[0]?.method).toBe(method)
    runtime.finish(0, true, 'pages/index')
    await expect(result).resolves.toBe(true)
  })

  it('单页返回时按要求前往首页兜底', async () => {
    const runtime = createRuntime()
    runtime.pageStack[0] = { options: {}, route: 'pages/about' }
    const { usePages } = await import('./index')
    const result = usePages().goBack(true)
    expect(runtime.requests[0]).toMatchObject({ method: 'switchTab', options: { url: '/pages/index' } })
    expect(runtime.uni.navigateBack).not.toHaveBeenCalled()
    runtime.finish(0, true, 'pages/index')

    await expect(result).resolves.toBe(true)
  })

  it('返回失败时可使用首页兜底的结果', async () => {
    const runtime = createRuntime()
    runtime.pageStack.push({ options: {}, route: 'pages/detail' })
    const { usePages } = await import('./index')
    const result = usePages().goBack(true)
    runtime.finish(0, false)
    await Promise.resolve()
    expect(runtime.requests[1]).toMatchObject({ method: 'switchTab', options: { url: '/pages/index' } })
    runtime.finish(1, false)

    await expect(result).resolves.toBe(false)
  })

  it('未启用首页兜底时返回失败只返回 false', async () => {
    const runtime = createRuntime()
    const { usePages } = await import('./index')
    const result = usePages().goBack()
    runtime.finish(0, false)

    await expect(result).resolves.toBe(false)
    expect(runtime.requests).toHaveLength(1)
  })
})
