import type { UniappRequestAdapter } from '@alova/adapter-uniapp'
import AdapterUniapp from '@alova/adapter-uniapp'
import { createAlova } from 'alova'
import { appEnv } from '@/config/env'
import { toRequestError } from './error'
import { resolveResponse } from './response'

/** 独立请求客户端的配置 */
export interface HttpClientOptions {
  /** API 根地址，小程序与 App 应使用完整 HTTPS 地址 */
  baseURL: string
  /** 请求超时毫秒数，默认 10000，可在单个 Method 中覆盖 */
  timeout?: number
  /** 业务成功码，默认 0，按值和类型严格比较 */
  successCode?: number | string
  /**
   * 每次发送前读取公共请求头，适用于租户、语言等运行时上下文
   *
   * @description 单次 headers 按名称忽略大小写覆盖公共值；null 或 undefined 不发送，认证头最后由 getToken 处理
   */
  getHeaders?: () => Readonly<Record<string, string | undefined | null>> | undefined | null
  /** 每次发送时读取 Token；返回空值会移除旧认证头 */
  getToken?: () => string | undefined | null
  /** 鉴权请求头名称，默认读取 VITE_AUTH_HEADER_NAME */
  authHeaderName?: string
  /** Token 前缀，默认读取 VITE_AUTH_TOKEN_PREFIX；空字符串表示直接发送 Token */
  authTokenPrefix?: string
  /** 替换传输适配器，默认使用 uni-app 官方适配器 */
  requestAdapter?: UniappRequestAdapter
}

/**
 * 创建可直接使用 alova Method 与 hooks 的请求客户端
 *
 * @description 默认关闭缓存和请求共享，失败始终拒绝 Promise；界面提示由调用方处理
 */
export function createHttpClient(options: HttpClientOptions) {
  const authHeaderName = (options.authHeaderName ?? appEnv.authHeaderName).trim()
  const authTokenPrefix = (options.authTokenPrefix ?? appEnv.authTokenPrefix).trim()

  return createAlova({
    ...AdapterUniapp({ mockRequest: options.requestAdapter }),
    baseURL: options.baseURL,
    timeout: options.timeout ?? 10_000,
    cacheFor: null,
    shareRequest: false,
    cacheLogger: false,
    beforeRequest(method) {
      if (options.getHeaders && method.meta?.commonHeaders !== false) {
        const headers = new Map<string, [string, unknown]>()
        for (const [key, value] of Object.entries(options.getHeaders() ?? {}))
          headers.set(key.toLowerCase(), [key, value])
        for (const [key, value] of Object.entries(method.config.headers))
          headers.set(key.toLowerCase(), [key, value])

        // alova 每次发送提供独立的 Method 副本，不把运行时上下文写回原始配置
        method.config.headers = Object.fromEntries([...headers.values()].filter(([, value]) => value !== null && value !== undefined))
      }
      if (options.getToken && method.meta?.auth !== false) {
        const token = options.getToken()
        // Method 可重复发送，先移除上一轮认证头，避免退出登录后继续携带旧 Token
        for (const key of Object.keys(method.config.headers)) {
          if (key.toLowerCase() === authHeaderName.toLowerCase())
            delete method.config.headers[key]
        }
        if (token)
          method.config.headers[authHeaderName] = authTokenPrefix ? `${authTokenPrefix} ${token}` : token
      }
    },
    responded: {
      onSuccess: (response, method) => resolveResponse(response, method.meta, options.successCode),
      onError(error) {
        throw toRequestError(error)
      },
    },
  })
}
