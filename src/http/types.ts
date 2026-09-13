/** 服务端统一响应，成功码默认为 0 */
export interface ApiResponse<T> {
  code: number | string
  message: string
  data: T
}

/** 单个请求的附加处理选项 */
export interface RequestMeta {
  /** 为 false 时不读取 Token，保留调用方提供的认证头 */
  auth?: boolean
  /** 为 false 时不读取公共请求头，保留单次 headers；不影响 Token 注入 */
  commonHeaders?: boolean
  /** 默认解包业务响应；body 返回响应体，raw 返回完整 uni 响应，均检查 HTTP 状态 */
  responseMode?: 'data' | 'body' | 'raw'
}

declare module 'alova' {
  interface AlovaCustomTypes {
    meta: RequestMeta
  }
}
