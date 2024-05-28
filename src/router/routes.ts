import type { TabBar, UserPagesConfig } from "@uni-helper/vite-plugin-uni-pages"
import { globalStyle, tabBarStyle } from "../config/theme"
import type { AppPageMetaDatum, AppSubPackage } from "./types"

// 主包
import homeRoute from "./modules/main/home.route"
import userCenterRoute from "./modules/main/user-center.route"
import addressBookRoute from "./modules/main/address-book.route"

// 子包
import aboutRoute from "./modules/sub/about.route"

// TODO: 通过import.meta.glob动态导入 此处由于项目特殊性暂时无法使用，但是其他项目可以参考使用
// const routeModules = import.meta.glob<AppPageMetaDatum>("./modules/**.main.route.ts", { eager: true, import: "default" })
// const routeModulesList = Object.values(routeModules)
// const subRouteModules = import.meta.glob<AppSubPackage>("./modules/**.sub.route.ts", { eager: true, import: "default" })
// const subRouteModulesList = Object.values(subRouteModules)

export const pagesList: AppPageMetaDatum[] = [
  homeRoute,
  addressBookRoute,
  ...userCenterRoute,
]

export const subPackages: AppSubPackage[] = [
  aboutRoute,
]

// 根据name查询text || navigationBarTitleText
export function getPageText(name: string) {
  const page = pagesList.find(page => page.name === name)

  if (!page?.text) {
    const subPackage = subPackages.find(subPackage => subPackage.pages.some(page => page.name === name))

    return subPackage?.pages.find(page => page.name === name)?.style?.navigationBarTitleText || ""
  }

  return page.text
}

// 根据name查询navigationStyle是否是custom
export function isCustomNavigationStyle(name: string) {
  const page = pagesList.find(page => page.name === name)

  if (!page) {
    const subPackage = subPackages.find(subPackage => subPackage.pages.some(page => page.name === name))
    return subPackage?.pages.some(page => page.style?.navigationStyle === "custom") || false
  }

  if (!page?.style)
    return false

  return page.style.navigationStyle === "custom"
}

// 根据name查询tabbar
export function isTabbar(name: string) {
  const page = pagesList.find(page => page.name === name)

  if (!page) {
    const subPackage = subPackages.find(subPackage => subPackage.name === name)
    return subPackage?.pages.some(page => page.tabbar) || false
  }

  return page.tabbar
}

/**
 * 根据name查询layout
 * @param name route name
 * @returns `false` 表示不使用任何layout | `"notabbar"` 表示不使用tabbar | `undefined` 表示使用默认layout
 */
export function getLayout(name: string) {
  const page = pagesList.find(page => page.name === name)

  if (!page) {
    const subPackage = subPackages.find(subPackage => subPackage.pages.some(page => page.name === name))
    return subPackage?.pages.find(page => page.name === name)?.layout
  }

  return page.layout
}

// 根据name查询needauth
export function isNeedAuth(name?: string) {
  const page = pagesList.find(page => page.name === name)

  if (!page) {
    const subPackage = subPackages.find(subPackage => subPackage.pages.some(page => page.name === name))
    return subPackage?.pages.some(page => page.needauth) || false
  }

  return page.needauth
}

// 根据name查询denyAccessAfterLogin
export function isDenyAccessAfterLogin(name?: string) {
  const page = pagesList.find(page => page.name === name)

  if (!page) {
    const subPackage = subPackages.find(subPackage => subPackage.pages.some(page => page.name === name))
    return subPackage?.pages.some(page => page.denyAccessAfterLogin) || false
  }

  return page.denyAccessAfterLogin
}

export const tabBarList = pagesList.filter(page => page.tabbar).map(page => ({
  pagePath: page.path,
  text: page.text,
})) as TabBar["list"]

export const UniPages: UserPagesConfig = {
  pages: pagesList,
  subPackages,
  globalStyle,
  tabBar: {
    ...tabBarStyle,
    list: tabBarList,
  },
}
