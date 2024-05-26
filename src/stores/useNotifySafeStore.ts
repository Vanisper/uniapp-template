import { defineStore } from "pinia"
import { isCustomNavigationStyle } from "@/router/routes"

/**
 * 使用通知提示的时候需要使用此Store | 因为需要注意到顶部的高度
 */
export const useNotifySafeStore = defineStore("notifySafe", () => {
  const safeHeight = ref(0)
  const windowRectStore = useWindowRectStore()
  const customNavigation = computed(() => (routeName: string) => isCustomNavigationStyle(routeName || "") && (uni.getSystemInfoSync().osName !== "windows"))

  /**
   * 为了适配微信小程序顶部状态栏+自定义标题栏 必须执行一次
   * @param routeName 页面路由名称
   */
  function weixinFix(routeName: string) {
    // #ifndef H5
    if (customNavigation.value(routeName))
      // 适配微信小程序顶部状态栏+自定义标题栏
      safeHeight.value = windowRectStore.windowRect.statusBarHeight + windowRectStore.windowRect.customTitleHeight
    // #endif
  }

  return {
    safeHeight,
    weixinFix,
  }
})
