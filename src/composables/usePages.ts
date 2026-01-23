import type { GlobalStyle, PageMetaDatum, UserPagesConfig } from '@uni-helper/vite-plugin-uni-pages'
import pagesData from '@/pages.json'
// import { pages, subPackages } from 'virtual:uni-pages'

export type NavigateToOptions = UniApp.NavigateToOptions & globalThis.NavigateToOptions
export type PagePath = NavigateToOptions['url']

export type ActualKeys<T> = keyof {
  [P in keyof T as string extends P ? never : P]: T[P];
}

const pagesJson = pagesData as unknown as UserPagesConfig
const { pages, subPackages, tabBar, globalStyle } = pagesJson

export function usePages() {
  /** 全局标题栏配置 */
  const globalNavigationStyle = globalStyle?.navigationStyle ?? 'default'
  const globalNavigationBarTitleText = globalStyle?.navigationBarTitleText ?? 'uniapp'

  /** 查询是否是 tabbar 页面 */
  function isTabBarPage(pathUrl: PagePath) {
    const page = tabBar?.list?.find((tabBar) => {
      return tabBar?.pagePath === pathUrl
    })
    return !!page
  }

  function findPage(pagePath: PagePath) {
    const find = (pageMeta: PageMetaDatum) => pageMeta.path === pagePath

    const page = pages?.find(find)

    if (!page) {
      const subPackage = subPackages
        ?.find(subPackage => subPackage.pages?.some(pageMeta => [subPackage.root, pageMeta.path].join('/') === pagePath))

      const page = subPackage?.pages?.find(pageMeta => [subPackage.root, pageMeta.path].join('/') === pagePath)
      return page
    }

    return page
  }

  function getPageStyle<K extends ActualKeys<GlobalStyle>>(pagePath: PagePath, style: K) {
    const page = findPage(pagePath)
    return page?.style?.[style] as undefined | GlobalStyle[K]
  }

  /** 查询是否是 custom 导航栏 */
  function isCustomNavigationStyle(pagePath: PagePath) {
    const navigationStyle = getPageStyle(pagePath, 'navigationStyle')
    return (navigationStyle ?? globalNavigationStyle) === 'custom'
  }

  function getNavigationBarTitleText(pagePath: PagePath) {
    const navigationBarTitleText = getPageStyle(pagePath, 'navigationBarTitleText')
    return navigationBarTitleText ?? globalNavigationBarTitleText
  }

  function getPageOptions(pagePath: PagePath) {
    return {
      /** 是否自定义导航栏 */
      customNavigation: isCustomNavigationStyle(pagePath),
      /** 是否是 tabbar 页面 */
      tabbarPage: isTabBarPage(pagePath),
      navigationBarTitleText: getNavigationBarTitleText(pagePath),
    }
  }

  const _getCurrentPages = getCurrentPages<{
    /** 路由所带的参数 */
    options: any
  }>
  const currentPages = computed(() => _getCurrentPages())

  function getCurrentPage() {
    const pages = currentPages.value // 获取页面堆栈
    const currentPage = pages[pages.length - 1] // 获取当前页面的对象
    const route = currentPage.route as PagePath // 获取当前页面的路由

    return Object.assign(currentPage, getPageOptions(route))
  }

  const currentPage = computed(() => getCurrentPage())

  function go(pagePath: string, switchTab = false) {
    if (switchTab === true) {
      uni.switchTab({
        url: pagePath,
        fail(error) {
          if (pagePath.startsWith('/')) {
            // todo: try navigateTo
            throw error
          }
          uni.switchTab({ url: `/${pagePath}` })
        },
      })
    }
    else {
      uni.navigateTo({
        url: pagePath,
        fail(error) {
          if (pagePath.startsWith('/')) {
            // todo: try switchTab
            throw error
          }
          uni.navigateTo({ url: `/${pagePath}` })
        },
      })
    }
  }

  /** 前往首页 */
  function goHome() {
    const homePath = pages?.find(i => i.type === 'home')?.path
    if (!homePath) {
      return console.warn('找不到首页')
    }
    go(homePath, true)
  }

  /**
   * 返回上一页
   *
   * @param [home] 在页面栈只有一个的情况下，前往首页兜底
   */
  function goBack(home = false) {
    if (typeof home !== 'boolean') {
      home = false
    }
    if (home && currentPages.value.length <= 1) {
      console.warn('[usePages]', '页面栈不大于1，goHome 兜底')
      return goHome()
    }
    uni.navigateBack({}).catch(() => {
      if (!home) {
        return
      }
      console.warn('[usePages]', 'navigateBack 错误，goHome 兜底')
      goHome()
    })
  }

  return {
    pagesJson,
    currentPage,
    currentPages,
    isTabBarPage,
    isCustomNavigationStyle,
    getCurrentPage,
    go,
    goHome,
    goBack,
  }
}

export default usePages
