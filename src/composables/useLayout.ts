import { THEME_CONFIG } from '@/configs/theme'

export function useLayout() {
  const { currentPage, isCustomNavigationStyle, pagesJson } = usePages()

  const customTabbar = THEME_CONFIG.tabbar.mode === 'custom'

  /** 是否显示 navbar */
  const hasNavbar = computed(() => {
    const route = currentPage.value?.route
    return route && isCustomNavigationStyle(route)
  })

  /** 是否显示 tabbar */
  const hasTabbar = computed(() => {
    const route = currentPage.value?.route
    const tabbarList = pagesJson.tabBar?.list
    return customTabbar && route && tabbarList?.some(tab => tab.pagePath === route)
  })

  /** navbar 高度 */
  const navbarHeight = computed(() =>
    hasNavbar.value ? THEME_CONFIG.navbar.height : 0,
  )

  /** tabbar 高度 */
  const tabbarHeight = computed(() =>
    hasTabbar.value ? THEME_CONFIG.tabbar.height : 0,
  )

  /**
   * 页面容器样式
   * @description 用于 PageWrapper 等组件
   */
  const pageWrapperStyle = computed(() => ({
    '--navbar-height': `${navbarHeight.value}px`,
    '--tabbar-height': `${tabbarHeight.value}px`,
  }))

  /**
   * 隐藏原生 tabbar
   * @description 非微信小程序端
   */
  function hideNativeTabbar() {
    // #ifndef MP-WEIXIN
    if (hasTabbar.value) {
      uni.hideTabBar()
    }
    // #endif
  }

  return {
    customTabbar,
    hasNavbar,
    hasTabbar,
    navbarHeight,
    tabbarHeight,
    pageWrapperStyle,
    hideNativeTabbar,
  }
}

export default useLayout
