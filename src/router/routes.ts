import type { PageMetaDatum, TabBar, UserPagesConfig } from "@uni-helper/vite-plugin-uni-pages"

interface AppPageMetaDatum extends PageMetaDatum {
  name?: string
  text?: string
  icon?: string
  tabbar?: boolean
}

export const pagesList: AppPageMetaDatum[] = [
  {
    path: "pages/home/index",
    // #region
    name: "workbench",
    text: "工作台",
    icon: "app",
    tabbar: true,
    // #endregion
    style: {
      "mp-alipay": {
        allowsBounceVertical: "NO",
      },
      "enablePullDownRefresh": true,
      "navigationBarTitleText": "工作台",
      // navigationStyle: "custom",
      // backgroundColor: "#F5F5F5",
    },
  },
  {
    path: "pages/user_center/index",
    // #region
    name: "user_center",
    text: "我的",
    icon: "user",
    tabbar: true,
    // #endregion
    style: {
      "mp-alipay": {
        allowsBounceVertical: "NO",
      },
      "navigationBarTitleText": "我的",
      "navigationStyle": "custom",
      "backgroundColor": "#F5F5F5",
    },
  },
  {
    path: "pages/about/index",
    // #region
    name: "about",
    text: "关于",
    icon: "more",
    tabbar: true,
    // #endregion
    style: {
      "mp-alipay": {
        allowsBounceVertical: "NO",
      },
      "navigationBarTitleText": "关于",
    },
  },
]

export const tabBarList = pagesList.filter(page => page.tabbar).map(page => ({
  pagePath: page.path,
  text: page.text,
})) as TabBar["list"]

export const UniPages: UserPagesConfig = {
  pages: pagesList,
  globalStyle: {
    backgroundColor: "@bgColor",
    backgroundColorBottom: "@bgColorBottom",
    backgroundColorTop: "@bgColorTop",
    backgroundTextStyle: "@bgTxtStyle",
    navigationBarBackgroundColor: "@navBgColor",
    navigationBarTextStyle: "@navTxtStyle",
    // navigationBarTitleText: "Vitesse-Uni",
    // navigationStyle: "custom",
  },
  tabBar: {
    backgroundColor: "@tabBgColor",
    borderStyle: "@tabBorderStyle",
    color: "@tabFontColor",
    selectedColor: "@tabSelectedColor",
    list: tabBarList,
  },
}
