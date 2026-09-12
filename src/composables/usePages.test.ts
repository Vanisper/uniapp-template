import type { App, ComponentOptions } from 'vue'
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
  const interceptors = new Map<string, { complete?: () => void }>()
  const navigate = (method: string) => vi.fn((options: NavigationOptions) => {
    requests.push({ method, options })
  })
  const uni = {
    navigateTo: navigate('navigateTo'),
    redirectTo: navigate('redirectTo'),
    reLaunch: navigate('reLaunch'),
    switchTab: navigate('switchTab'),
    navigateBack: navigate('navigateBack'),
    addInterceptor: vi.fn((method: string, interceptor: { complete?: () => void }) => {
      interceptors.set(method, interceptor)
    }),
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
    interceptors.get(method)?.complete?.()
  }

  vi.stubGlobal('getCurrentPages', () => pageStack)
  vi.stubGlobal('uni', uni)
  return { pageStack, requests, uni, finish }
}

function createApplication() {
  const mixin = vi.fn<(options: ComponentOptions) => App>()
  const app = { mixin } as unknown as App
  return { app, mixin }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('usePages', () => {
  it('启动时页面栈为空也能安全查询', async () => {
    const { pageStack } = createRuntime()
    pageStack.length = 0
    const { usePages } = await import('./usePages')
    const pages = usePages()

    expect(pages.currentPages.value).toEqual([])
    expect(pages.currentPage.value).toBeUndefined()
    expect(pages.getCurrentPage()).toBeUndefined()
    expect(pages.currentRoute.value).toBe('')
    expect(pages.isTabBarPage(pages.currentRoute.value)).toBe(false)
  })

  it('显式同步会更新所有调用方的真实页面状态', async () => {
    const { pageStack } = createRuntime()
    const { usePages } = await import('./usePages')
    const first = usePages()
    const second = usePages()
    expect(first.currentRoute.value).toBe('pages/index')
    expect(second.currentRoute.value).toBe('pages/index')

    pageStack[0] = { options: {}, route: 'pages/about' }
    first.syncPageStack()

    expect(first.currentRoute.value).toBe('pages/about')
    expect(second.currentPage.value?.route).toBe('pages/about')
    expect(second.currentPage.value?.navigationBarTitleText).toBe('应用')
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
    const { usePages } = await import('./usePages')

    expect(usePages().currentPage.value?.route).toBe('pages/index')
  })

  it('导航成功前保持真实路由，成功后同步页面栈', async () => {
    const runtime = createRuntime()
    const { usePages } = await import('./usePages')
    const pages = usePages()
    const result = pages.go('pages/about', true)

    expect(pages.currentRoute.value).toBe('pages/index')
    expect(runtime.requests[0]).toMatchObject({ method: 'switchTab', options: { url: '/pages/about' } })
    runtime.finish(0, true, 'pages/about')

    await expect(result).resolves.toBe(true)
    expect(pages.currentRoute.value).toBe('pages/about')
  })

  it('导航失败返回 false 且不改变真实路由', async () => {
    const runtime = createRuntime()
    const { usePages } = await import('./usePages')
    const pages = usePages()
    const result = pages.go('/pages/about', true)
    runtime.finish(0, false)

    await expect(result).resolves.toBe(false)
    expect(pages.currentRoute.value).toBe('pages/index')
    expect(runtime.requests).toHaveLength(1)
  })

  it('同步抛出的导航错误也转换为 false', async () => {
    const { uni } = createRuntime()
    uni.navigateTo.mockImplementation(() => {
      throw new Error('平台导航失败')
    })
    const { usePages } = await import('./usePages')

    await expect(usePages().go('pages/detail')).resolves.toBe(false)
  })

  it('普通页面使用根路径导航并保留查询参数', async () => {
    const runtime = createRuntime()
    const { usePages } = await import('./usePages')
    const pages = usePages()
    const result = pages.go('/pages/detail?id=3')
    expect(runtime.requests[0]).toMatchObject({ method: 'navigateTo', options: { url: '/pages/detail?id=3' } })

    runtime.finish(0, true, 'pages/detail')

    await expect(result).resolves.toBe(true)
    expect(pages.currentRoute.value).toBe('pages/detail')
  })

  it('较早导航的晚到失败不能覆盖后来成功的真实路由', async () => {
    const runtime = createRuntime()
    const { usePages } = await import('./usePages')
    const pages = usePages()
    const first = pages.go('pages/about', true)
    const second = pages.go('pages/detail')
    runtime.finish(1, true, 'pages/detail')
    await expect(second).resolves.toBe(true)
    runtime.finish(0, false)

    await expect(first).resolves.toBe(false)
    expect(pages.currentRoute.value).toBe('pages/detail')
  })

  it('返回成功后同步真实路由', async () => {
    const runtime = createRuntime()
    runtime.pageStack.push({ options: {}, route: 'pages/detail' })
    const { usePages } = await import('./usePages')
    const pages = usePages()
    expect(pages.currentRoute.value).toBe('pages/detail')
    const result = pages.goBack()
    expect(runtime.requests[0]?.method).toBe('navigateBack')
    runtime.finish(0, true, 'pages/index')

    await expect(result).resolves.toBe(true)
    expect(pages.currentRoute.value).toBe('pages/index')
  })

  it('单页返回时按要求前往首页兜底', async () => {
    const runtime = createRuntime()
    runtime.pageStack[0] = { options: {}, route: 'pages/about' }
    const { usePages } = await import('./usePages')
    const result = usePages().goBack(true)
    expect(runtime.requests[0]).toMatchObject({ method: 'switchTab', options: { url: '/pages/index' } })
    expect(runtime.uni.navigateBack).not.toHaveBeenCalled()
    runtime.finish(0, true, 'pages/index')

    await expect(result).resolves.toBe(true)
  })

  it('返回失败时可使用首页兜底的结果', async () => {
    const runtime = createRuntime()
    runtime.pageStack.push({ options: {}, route: 'pages/detail' })
    const { usePages } = await import('./usePages')
    const result = usePages().goBack(true)
    runtime.finish(0, false)
    await Promise.resolve()
    expect(runtime.requests[1]).toMatchObject({ method: 'switchTab', options: { url: '/pages/index' } })
    runtime.finish(1, false)

    await expect(result).resolves.toBe(false)
  })

  it('未启用首页兜底时返回失败只返回 false', async () => {
    const runtime = createRuntime()
    const { usePages } = await import('./usePages')
    const result = usePages().goBack()
    runtime.finish(0, false)

    await expect(result).resolves.toBe(false)
    expect(runtime.requests).toHaveLength(1)
  })
})

describe('setupPages', () => {
  it.each(['navigateTo', 'redirectTo', 'reLaunch', 'switchTab', 'navigateBack'] as const)(
    '外部直接调用 %s 完成后同步页面栈',
    async (method) => {
      const runtime = createRuntime()
      const { usePages } = await import('./usePages')
      const { setupPages } = await import('@/plugins/pages')
      setupPages(createApplication().app)
      const pages = usePages()
      expect(pages.currentRoute.value).toBe('pages/index')

      runtime.uni[method]({ url: '/pages/about' })
      runtime.finish(0, true, 'pages/about')

      expect(pages.currentRoute.value).toBe('pages/about')
    },
  )

  it('原生 tab 切换触发 onShow 时回到真实路由', async () => {
    const runtime = createRuntime()
    const { usePages } = await import('./usePages')
    const { setupPages } = await import('@/plugins/pages')
    const { app, mixin } = createApplication()
    setupPages(app)
    const pages = usePages()
    const result = pages.go('pages/about', true)
    runtime.finish(0, true, 'pages/about')
    await result
    expect(pages.currentRoute.value).toBe('pages/about')

    runtime.pageStack[0] = { options: {}, route: 'pages/index' }
    const hooks = mixin.mock.calls[0]![0]
    hooks.onShow?.call({})

    expect(pages.currentRoute.value).toBe('pages/index')
    expect(runtime.requests).toHaveLength(1)
  })

  it('首次显示时栈未就绪可在 onReady 同步', async () => {
    const runtime = createRuntime()
    runtime.pageStack.length = 0
    const { usePages } = await import('./usePages')
    const { setupPages } = await import('@/plugins/pages')
    const { app, mixin } = createApplication()
    setupPages(app)
    const pages = usePages()
    const hooks = mixin.mock.calls[0]![0]
    hooks.onShow?.call({})
    expect(pages.currentRoute.value).toBe('')

    runtime.pageStack.push({ options: {}, route: 'pages/index' })
    hooks.onReady?.call({})

    expect(pages.currentRoute.value).toBe('pages/index')
  })

  it('返回 API 先成功时等待页面 onShow 同步真实返回结果', async () => {
    const runtime = createRuntime()
    runtime.pageStack.push({ options: {}, route: 'pages/detail' })
    const { usePages } = await import('./usePages')
    const { setupPages } = await import('@/plugins/pages')
    const { app, mixin } = createApplication()
    setupPages(app)
    const pages = usePages()
    const result = pages.goBack()
    runtime.finish(0, true)

    await expect(result).resolves.toBe(true)
    expect(pages.currentRoute.value).toBe('pages/detail')

    runtime.pageStack.pop()
    mixin.mock.calls[0]![0].onShow?.call({})

    expect(pages.currentRoute.value).toBe('pages/index')
  })

  it('重复安装不会重复添加页面钩子或全局拦截器', async () => {
    const { uni } = createRuntime()
    const { setupPages } = await import('@/plugins/pages')
    const first = createApplication()
    const second = createApplication()
    setupPages(first.app)
    setupPages(first.app)
    setupPages(second.app)

    expect(first.mixin).toHaveBeenCalledTimes(1)
    expect(second.mixin).toHaveBeenCalledTimes(1)
    expect(uni.addInterceptor).toHaveBeenCalledTimes(5)
  })
})
