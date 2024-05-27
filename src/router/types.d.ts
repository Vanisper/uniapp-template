import type { PageMetaDatum, SubPackage } from "@uni-helper/vite-plugin-uni-pages"

export interface AppPageMetaDatum extends PageMetaDatum {
  /** 路由name */
  name?: string
  /** 导航栏标题文字内容 */
  text?: string
  /** 是否设置为 `tabbar` 页面 */
  tabbar?: boolean
  /** 图标 | 一般目前只用作 `tabbar` 的显示图标 */
  icon?: string
  /** 是否需要登录 */
  needauth?: boolean
  /** 是否登录之后回不让访问 */
  denyAccessAfterLogin?: boolean
  /** 使用布局 | 参看 `src/layouts` 文件夹 */
  layout?: "notabbar" | false // 不写就是default
}

export interface AppSubPackage extends SubPackage {
  /** 路由name */
  name?: string
  /** 导航栏标题文字内容 */
  text: string
  pages: AppPageMetaDatum[]
}
