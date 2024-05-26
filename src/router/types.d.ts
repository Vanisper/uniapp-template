import type { PageMetaDatum, SubPackage } from "@uni-helper/vite-plugin-uni-pages"

export interface AppPageMetaDatum extends PageMetaDatum {
  name?: string
  text?: string
  icon?: string
  tabbar?: boolean
  /** 是否需要登录 */
  needauth?: boolean
  /** 是否登录之后回不让访问 */
  denyAccessAfterLogin?: boolean
  layout?: "notabbar" | false // 不写就是default
}

export interface AppSubPackage extends SubPackage {
  name?: string
  text: string
  pages: AppPageMetaDatum[]
}
