import { getToken } from '@/auth/token'
import { appEnv } from '@/config/env'
import { createMockAdapter } from '@/mock'
import { createHttpClient } from './client'

export { createHttpClient } from './client'
export type { HttpClientOptions } from './client'
export { RequestError, toRequestError } from './error'
export type { RequestErrorKind } from './error'
export type { ApiResponse, RequestMeta } from './types'

/** production 模式始终关闭 Mock，其余模式由环境开关控制 */
export const isMockEnabled = import.meta.env.MODE !== 'production' && import.meta.env.VITE_MOCK_ENABLED === 'true'

/** 项目公共请求客户端，接口函数应返回 Method 以保留取消、缓存与 hooks 能力 */
export const http = createHttpClient({
  baseURL: appEnv.apiBaseURL,
  timeout: appEnv.requestTimeout,
  getToken,
  requestAdapter: isMockEnabled ? createMockAdapter(appEnv.mockDelay) : undefined,
})
