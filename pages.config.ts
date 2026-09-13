import type { TabBar } from '@uni-helper/vite-plugin-uni-pages'
import process from 'node:process'
import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'
import { THEME_CONFIG } from './src/configs/theme'

const platform = process.env.UNI_PLATFORM
let tabBarExpand: TabBar | undefined

if (THEME_CONFIG.tabbar.mode === 'custom') {
  tabBarExpand = {
    // Node 配置不经过条件编译，平台专属字段需在生成时筛选
    ...(platform === 'mp-weixin' || platform === 'mp-toutiao' ? { custom: true } : {}),
    ...(platform === 'mp-alipay' ? { customize: true, overlay: true } : {}),
    // H5 与 App 的原生底栏仍由接入层调用 hideTabBar 隐藏
    height: '0',
  }
}

export default defineUniPages({
  pages: [],
  globalStyle: {
    // 导航栏配置
    'navigationBarBackgroundColor': '@navBgColor',
    'navigationBarTextStyle': '@navTxtStyle',
    'navigationBarTitleText': 'Uni Creator',

    // 页面背景配置
    'backgroundColor': '@bgColor',
    'backgroundTextStyle': '@bgTxtStyle',
    'backgroundColorTop': '@bgColorTop',
    'backgroundColorBottom': '@bgColorBottom',

    // 下拉刷新配置
    'enablePullDownRefresh': false,
    'onReachBottomDistance': 50,

    'app-plus': {
      animationType: 'pop-in',
      animationDuration: 300,
    },
    'app-harmony': {
      animationType: 'pop-in',
      animationDuration: 300,
    },

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
