import { THEME_CONFIG } from '@/configs/theme'
import { usePageRoute } from '../usePageRoute'

function getNativeNavbarHeight(statusBarHeight: number) {
  try {
    const rectRes = uni.getMenuButtonBoundingClientRect()
    const padding = rectRes.top - statusBarHeight
    return rectRes.height + padding * 2
  }
  catch {
    return 44
  }
}

/**
 * 获取所属页面的导航栏、底栏与内容区域尺寸
 *
 * @description 高度单位均为 px
 */
export function useLayout() {
  const { isCustomNavigationStyle, isTabBarPage } = usePages()
  const pageRoute = usePageRoute() ?? ''
  const { safeBottom, statusBarHeight } = useWindowInfo()

  const customTabbar = THEME_CONFIG.tabbar.mode === 'custom'
  const nativeNavbarHeight = computed(() => getNativeNavbarHeight(statusBarHeight.value))

  /** 是否显示自定义导航栏 */
  const hasNavbar = computed(() => !!pageRoute && isCustomNavigationStyle(pageRoute))
  /** 是否显示自定义底栏 */
  const hasTabbar = computed(() =>
    customTabbar && isTabBarPage(pageRoute),
  )
  /** 所属页面是否使用原生底栏 */
  const hasNativeTabbar = computed(() =>
    !customTabbar && isTabBarPage(pageRoute),
  )

  const navbarHeight = computed(() =>
    hasNavbar.value ? THEME_CONFIG.navbar.height : nativeNavbarHeight.value,
  )

  const tabbarHeight = computed(() =>
    hasTabbar.value ? THEME_CONFIG.tabbar.height : 0,
  )

  /** 安全区域内扣除状态栏、导航栏与完整底栏后的保守内容高度 */
  const pageHeight = computed(() =>
    safeBottom.value - statusBarHeight.value - navbarHeight.value - tabbarHeight.value,
  )

  /** 页面容器使用的尺寸变量 */
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
    hasNativeTabbar,
    navbarHeight,
    tabbarHeight,
    pageHeight,
    pageWrapperStyle,
  }
}

export default useLayout
