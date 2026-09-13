import type { GlobalStyle, InternalPageItem, UserPagesConfig } from '@uni-helper/vite-plugin-uni-pages'
import pagesData from '@/pages.json'

export type NavigateToOptions = UniApp.NavigateToOptions & globalThis.NavigateToOptions
export type PagePath = NavigateToOptions['url']

export type ActualKeys<T> = keyof {
  [P in keyof T as string extends P ? never : P]: T[P];
}

const pagesJson = pagesData as unknown as UserPagesConfig
const { pages, subPackages, tabBar, globalStyle } = pagesJson

interface NavigationCallbacks {
  success: () => void
  fail: () => void
}

function navigate(invoke: (callbacks: NavigationCallbacks) => void): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      invoke({ success: () => resolve(true), fail: () => resolve(false) })
    }
    catch {
      resolve(false)
    }
  })
}

/** 查询真实页面状态和页面配置，并执行导航 */
export function usePages() {
  /** 全局标题栏配置 */
  const globalNavigationStyle = globalStyle?.navigationStyle ?? 'default'
  const globalNavigationBarTitleText = globalStyle?.navigationBarTitleText ?? 'uniapp'

  /** 查询是否是 tabbar 页面 */
  function isTabBarPage(pathUrl: string) {
    const page = tabBar?.list?.find((tabBar) => {
      return tabBar?.pagePath === pathUrl
    })
    return !!page
  }

  function findPage(pagePath: string) {
    const find = (pageMeta: InternalPageItem) => pageMeta.path === pagePath

    const page = pages?.find(find)

    if (!page) {
      const subPackage = subPackages
        ?.find(subPackage => subPackage.pages?.some(pageMeta => [subPackage.root, pageMeta.path].join('/') === pagePath))

      const page = subPackage?.pages?.find(pageMeta => [subPackage.root, pageMeta.path].join('/') === pagePath)
      return page
    }

    return page
  }

  function getPageStyle<K extends ActualKeys<GlobalStyle>>(pagePath: string, style: K) {
    const page = findPage(pagePath)
    return page?.style?.[style] as undefined | GlobalStyle[K]
  }

  /** 查询是否是 custom 导航栏 */
  function isCustomNavigationStyle(pagePath: string) {
    const navigationStyle = getPageStyle(pagePath, 'navigationStyle')
    return (navigationStyle ?? globalNavigationStyle) === 'custom'
  }

  function getNavigationBarTitleText(pagePath: string) {
    const navigationBarTitleText = getPageStyle(pagePath, 'navigationBarTitleText')
    return navigationBarTitleText ?? globalNavigationBarTitleText
  }

  function getPageOptions(pagePath: string) {
    return {
      /** 是否自定义导航栏 */
      customNavigation: isCustomNavigationStyle(pagePath),
      /** 是否是 tabbar 页面 */
      tabbarPage: isTabBarPage(pagePath),
      navigationBarTitleText: getNavigationBarTitleText(pagePath),
    }
  }

  /** 获取调用时的栈顶页面及其配置，空栈时返回 undefined */
  function getCurrentPage() {
    const pages = getCurrentPages<{
      /** 路由所带的参数 */
      options: any
    }>()
    const currentPage = pages[pages.length - 1]
    if (!currentPage) {
      return undefined
    }

    return Object.assign(currentPage, getPageOptions(currentPage.route ?? ''))
  }

  /**
   * 前往指定页面
   *
   * @param pagePath 应用根路径，可省略开头的 /，普通页面可携带查询参数
   * @param switchTab 是否使用 switchTab 切换底栏页面
   * @returns 导航 API 报告成功时返回 true，失败返回 false；不表示页面已显示完成
   */
  function go(pagePath: string, switchTab = false): Promise<boolean> {
    const url = `/${pagePath.replace(/^\/+/, '')}`
    return navigate(callbacks => switchTab
      ? uni.switchTab({ url, ...callbacks })
      : uni.navigateTo({ url, ...callbacks }))
  }

  /**
   * 前往配置中标记为 home 的页面
   *
   * @returns 导航 API 报告成功时返回 true，首页未配置或导航失败返回 false；不表示页面已显示完成
   */
  function goHome(): Promise<boolean> {
    const homePath = pages?.find(i => i.type === 'home')?.path
    if (!homePath) {
      return Promise.resolve(false)
    }
    return go(homePath, isTabBarPage(homePath))
  }

  /**
   * 返回上一页
   *
   * @param home 页面栈不足两页或返回失败时，是否前往首页兜底
   * @returns 返回或首页兜底的 API 报告成功时返回 true，否则返回 false；不表示页面已显示完成
   */
  async function goBack(home = false): Promise<boolean> {
    if (home === true && getCurrentPages().length <= 1) {
      return goHome()
    }
    const success = await navigate(callbacks => uni.navigateBack(callbacks))
    return !success && home === true ? goHome() : success
  }

  return {
    pagesJson,
    isTabBarPage,
    isCustomNavigationStyle,
    getNavigationBarTitleText,
    getCurrentPage,
    go,
    goHome,
    goBack,
  }
}

export default usePages
