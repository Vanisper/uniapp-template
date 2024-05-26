import { defineStore } from "pinia"

/**
--status-bar-height: 0px;
--top-window-height: 0px;
--window-left: 0px;
--window-right: 0px;
--window-margin: 0px;
--tab-bar-height: 50px;
--window-bottom: calc(0px + env(safe-area-inset-bottom));
--window-top: calc(44px + env(safe-area-inset-top));
 */
export const useWindowRectStore = defineStore("windowRect", () => {
  const windowRect = reactive({
    /**
     * # 状态栏高度
     */
    statusBarHeight: 20,
    /**
     * # 顶部窗口高度
     */
    topWindowHeight: 0,
    /**
     * # 窗口左边距
     */
    windowLeft: 0,
    /**
     * # 窗口右边距
     */
    windowRight: 0,
    /**
     * # 窗口边距
     */
    windowMargin: 0,
    /**
     * # 底部导航栏原生高度
     */
    tabBarHeight: 50,
    /**
     * # 标题栏原生高度  但是自定义的标题组件高度是48px
     */
    titleBarHeight: 44,
    /**
     * # 自定义的标题栏高度
     */
    customTitleHeight: 48,
    /**
     * # 自定义的tabbar栏高度
     */
    customtabBarHeight: 60,
    /**
     * # 屏幕高度
     */
    screenHeight: 0,

    /**
     * # 可使用窗口的底部位置
     */
    windowBottom: 0,
    /**
     * # 可使用窗口的顶部位置  小程序端参考性不大 都是0
     */
    windowTop: 0,

    /**
     * # 可使用窗口宽度
     */
    windowWidth: 0,
    /**
     * # 可使用窗口高度
     */
    windowHeight: 0,

    safeAreaBottomInset: 0,
    safeAreaTopInset: 0,
    safeAreaLeftInset: 0,
    safeAreaRightInset: 0,
  })

  function updateWindowRect() {
    uni.getSystemInfo({
      success: (res) => {
        windowRect.statusBarHeight = res.statusBarHeight || 0
        windowRect.windowBottom = res.windowBottom
        windowRect.windowTop = res.windowTop

        windowRect.windowWidth = res.windowWidth
        windowRect.windowHeight = res.windowHeight
        windowRect.screenHeight = res.screenHeight

        windowRect.safeAreaBottomInset = res.safeAreaInsets?.bottom || 0
        windowRect.safeAreaTopInset = res.safeAreaInsets?.top || 0
        windowRect.safeAreaLeftInset = res.safeAreaInsets?.left || 0
        windowRect.safeAreaRightInset = res.safeAreaInsets?.right || 0
      },
    })
  }

  return {
    windowRect,
    updateWindowRect,
  }
})
