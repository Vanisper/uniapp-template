import { appEnv } from '@/config/env'

/** 读取当前环境配置的 Token；未缓存或缓存内容不是非空字符串时返回 undefined */
export function getToken(): string | undefined {
  const value: unknown = uni.getStorageSync(appEnv.authTokenKey)
  return typeof value === 'string' ? value.trim() || undefined : undefined
}

/** 保存 Token 并移除首尾空白；空值会抛出错误并保留原缓存 */
export function setToken(token: string): void {
  const value = token.trim()
  if (!value)
    throw new Error('Token 不能为空')
  uni.setStorageSync(appEnv.authTokenKey, value)
}

/** 移除当前环境的 Token 缓存 */
export function clearToken(): void {
  uni.removeStorageSync(appEnv.authTokenKey)
}
