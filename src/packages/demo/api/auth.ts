import { http, isMockEnabled } from '@/http'

/** Mock 鉴权示例的用户信息 */
export interface AuthDemoUser {
  id: number
  name: string
}

/** Mock 登录响应，认证头状态由服务端检查 */
export interface AuthDemoLoginResult {
  token: string
  user: AuthDemoUser
  hasAuthHeader: boolean
}

/** Mock 匿名接口响应 */
export interface AuthDemoPublicResult {
  message: string
  hasAuthHeader: boolean
}

function requireAuthMock() {
  if (!isMockEnabled)
    throw new Error('鉴权示例仅在 Mock 开启时可用')
}

/** 使用示例账号登录，meta.auth 为 false 时不自动附加 Token */
export function loginDemo(username: string, password: string) {
  requireAuthMock()
  return http.Post<AuthDemoLoginResult>('/demo/auth/login', { username, password }, { meta: { auth: false } })
}

/** 使用缓存中的 Token 请求 Mock 个人信息 */
export function getDemoProfile() {
  requireAuthMock()
  return http.Get<AuthDemoUser>('/demo/auth/profile')
}

/** 请求 Mock 匿名接口，即使已经登录也不自动附加 Token */
export function getDemoPublic() {
  requireAuthMock()
  return http.Get<AuthDemoPublicResult>('/demo/auth/public', { meta: { auth: false } })
}
