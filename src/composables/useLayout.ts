/* eslint-disable unused-imports/no-unused-vars */
import { THEME_CONFIG } from '@/configs/theme'

/**
 * 获取默认 navbar 高度
 */
function getNavbarHeight() {
  const { statusBarHeight } = uni.getWindowInfo()
  try {
    const rectRes = uni.getMenuButtonBoundingClientRect()
    const padding = rectRes.top - statusBarHeight
    return rectRes.height + padding * 2
  }
  catch (error) {
    return 44
  }
}

/**
 * 默认 navbar 高度
 */
const defaultNavbarHeight = getNavbarHeight()

export function useLayout() {
  const { currentPage, isCustomNavigationStyle } = usePages()

  /**
   * 是否自定义 tabbar
   */
  const customTabbar = THEME_CONFIG.tabbar.mode === 'custom'

  const { safeArea: { bottom: safeBottom }, statusBarHeight } = uni.getWindowInfo()

  /**
   * 是否显示 navbar
   * @description 自定义 navbar
   */
  const hasNavbar = computed(() => {
    const route = currentPage.value?.route
    return !!route && isCustomNavigationStyle(route)
  })

  /**
   * 是否显示 tabbar
   * @description 自定义 tabbar
   */
  const hasTabbar = computed(() =>
    customTabbar && currentPage.value.tabbarPage,
  )

  /** navbar 高度 */
  const navbarHeight = computed(() =>
    hasNavbar.value ? THEME_CONFIG.navbar.height : defaultNavbarHeight,
  )

  /** tabbar 高度 */
  const tabbarHeight = computed(() =>
    hasTabbar.value ? THEME_CONFIG.tabbar.height : 0,
  )

  /**
   * 页面理论高度
   * - `pageHeight = safeBottom - statusBarHeight - navbarHeight - tabbarHeight`
   * @description
   */
  const pageHeight = computed(() =>
    safeBottom - statusBarHeight - navbarHeight.value - tabbarHeight.value,
  )

  /**
   * 页面容器样式
   * @description 用于 PageWrapper 等组件
   */
  const pageWrapperStyle = computed(() => ({
    '--status-bar-height': `${statusBarHeight}px`,
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
    statusBarHeight,
    hasNavbar,
    hasTabbar,
    navbarHeight,
    tabbarHeight,
    pageHeight,
    pageWrapperStyle,
    hideNativeTabbar,
  }
}

export default useLayout
