import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'

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
    custom: true,
    // #ifdef MP-ALIPAY
    customize: true,
    overlay: true,
    // #endif
    // height: '0',
    color: '@tabColor',
    selectedColor: '@tabSelectedColor',
    backgroundColor: '@tabBgColor',
    borderStyle: '@tabBorderStyle',
  },
})
