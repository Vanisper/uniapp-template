import type { TabBar } from '@uni-helper/vite-plugin-uni-pages'
import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'
import { THEME_CONFIG } from './src/configs/theme'

let tabBarExpand: TabBar | undefined

if (THEME_CONFIG.tabbar.mode === 'custom') {
  tabBarExpand = {
    // #region 自定义tabbar 时，启用此部分配置
    // 小程序端此部分配置足够隐藏原生 tabbar，其他端不能完全隐藏
    // TODO: 故相关部分需要调用 `uni.hideTabBar()`
    custom: true,
    // #ifdef MP-ALIPAY
    customize: true,
    overlay: true,
    // #endif
    height: '0',
    // #endregion
  }
}

export default defineUniPages({
  pages: [],
  globalStyle: {
    // 导航栏配置
    navigationBarBackgroundColor: '@navBgColor',
    navigationBarTextStyle: '@navTxtStyle',
    navigationBarTitleText: 'Uni Creator',

    // 页面背景配置
    backgroundColor: '@bgColor',
    backgroundTextStyle: '@bgTxtStyle',
    backgroundColorTop: '@bgColorTop',
    backgroundColorBottom: '@bgColorBottom',

    // 下拉刷新配置
    enablePullDownRefresh: false,
    onReachBottomDistance: 50,

    // 动画配置
    animationType: 'pop-in',
    animationDuration: 300,

    // navigationStyle: 'custom',
  },
  tabBar: {
    ...tabBarExpand,
    color: '@tabColor',
    selectedColor: '@tabSelectedColor',
    backgroundColor: '@tabBgColor',
    borderStyle: '@tabBorderStyle',
  },
})
