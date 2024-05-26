import type { TabBar, UserPagesConfig } from "@uni-helper/vite-plugin-uni-pages"
import themeJson from "../theme.json"

type TabBarStyle = Omit<TabBar, "list"> & Partial<TabBar>

const globalStyle: UserPagesConfig["globalStyle"] = {
  backgroundTextStyle: "@bgTxtStyle",
  // 下拉显示出来的窗口的背景色 注意：可能会被单页面设置的背景色覆盖
  backgroundColor: "@bgColor",

  // #region 仅 iOS 支持
  backgroundColorBottom: "@bgColorBottom",
  backgroundColorTop: "@bgColorTop",
  // #endregion

  // 导航栏背景颜色
  navigationBarBackgroundColor: "@navBgColor",
  navigationBarTextStyle: "@navTxtStyle",

  // navigationBarTitleText: "Vitesse-Uni",
  // navigationStyle: "custom",
  // enablePullDownRefresh: true,
}

const tabBarStyle: TabBarStyle = {
  backgroundColor: "@tabBgColor",
  borderStyle: "@tabBorderStyle",
  color: "@tabFontColor",
  selectedColor: "@tabSelectedColor",
}

const globalThemeVars = {
  light: {
    ...themeJson.light,
    colorTheme: themeJson.light.tabSelectedColor,
  },
  dark: {
    ...themeJson.dark,
    colorTheme: themeJson.dark.tabSelectedColor,
  },
}

export { globalStyle, tabBarStyle, globalThemeVars }
