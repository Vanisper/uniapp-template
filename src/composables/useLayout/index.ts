import { THEME_CONFIG } from '@/configs/theme'
import { usePageRoute } from '../usePageRoute'

/**
 * 获取默认 navbar 高度
 */
function getNavbarHeight(statusBarHeight: number) {
  try {
    const rectRes = uni.getMenuButtonBoundingClientRect()
    const padding = rectRes.top - statusBarHeight
    return rectRes.height + padding * 2
  }
  catch {
    return 44
  }
}

export function useLayout() {
  const { isCustomNavigationStyle, isTabBarPage } = usePages()
  const pageRoute = usePageRoute() ?? ''
  const { safeBottom, statusBarHeight } = useWindowInfo()

  /**
   * 是否自定义 tabbar
   */
  const customTabbar = THEME_CONFIG.tabbar.mode === 'custom'
  const defaultNavbarHeight = computed(() => getNavbarHeight(statusBarHeight.value))

  /**
   * 是否显示 navbar
   * @description 自定义 navbar
   */
  const hasNavbar = computed(() => {
    return !!pageRoute && isCustomNavigationStyle(pageRoute)
  })

  /**
   * 是否显示 tabbar
   * @description 自定义 tabbar
   */
  const hasTabbar = computed(() =>
    customTabbar && isTabBarPage(pageRoute),
  )

  /** navbar 高度 */
  const navbarHeight = computed(() =>
    hasNavbar.value ? THEME_CONFIG.navbar.height : defaultNavbarHeight.value,
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
    safeBottom.value - statusBarHeight.value - navbarHeight.value - tabbarHeight.value,
  )

  /**
   * 页面容器样式
   * @description 用于 PageWrapper 等组件
   */
  const pageWrapperStyle = computed(() => ({
    '--status-bar-height': `${statusBarHeight.value}px`,
    '--navbar-height': `${navbarHeight.value}px`,
    '--tabbar-height': `${tabbarHeight.value}px`,
  }))

  return {
    customTabbar,
    statusBarHeight,
    hasNavbar,
    hasTabbar,
    navbarHeight,
    tabbarHeight,
    pageHeight,
    pageWrapperStyle,
  }
}

export default useLayout
