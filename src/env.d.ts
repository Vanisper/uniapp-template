/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue"

  const component: DefineComponent<object, object, any>
  export default component
}

interface ImportMetaEnv extends Readonly<Record<string, string | boolean>> {
  /**
   * # 是否开发模式
   */
  DEV: boolean

  /**
   * # 是否生产模式
   */
  PROD: boolean

  /**
   * # 当前环境模式
   */
  MODE: string

  /**
   * # api请求基础路径
   */
  VITE_APP_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
