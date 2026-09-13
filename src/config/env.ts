/** 客户端环境配置，数值以毫秒为单位 */
export interface AppEnv {
  /** API 根地址，移除末尾斜杠；空值用于 Mock 演示 */
  readonly apiBaseURL: string
  /** 请求超时毫秒数 */
  readonly requestTimeout: number
  /** 鉴权请求头名称，默认 Authorization */
  readonly authHeaderName: string
  /** Token 前缀，非空时与 Token 之间自动加一个空格；空值表示直接发送 Token */
  readonly authTokenPrefix: string
  /** Mock 响应延迟毫秒数 */
  readonly mockDelay: number
  /** Vite mode，允许 development、test、production 之外的自定义值 */
  readonly mode: string
  /** Mock 开关，production 模式始终为 false */
  readonly mockEnabled: boolean
}

type AppEnvSource = Partial<Pick<ImportMetaEnv, 'VITE_API_BASE_URL' | 'VITE_REQUEST_TIMEOUT' | 'VITE_AUTH_HEADER_NAME' | 'VITE_AUTH_TOKEN_PREFIX' | 'VITE_MOCK_DELAY' | 'VITE_MOCK_ENABLED'>> & { MODE: string }

function positiveNumber(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined)
    return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0)
    throw new Error(`[env] ${name} 必须为有限正数`)
  return parsed
}

/**
 * 解析客户端环境变量，缺失值使用模板默认值
 *
 * @description API 地址非空时必须包含 HTTP(S) 协议和主机；无效地址、鉴权配置、数字或开关会抛出配置错误
 */
export function parseAppEnv(source: AppEnvSource): AppEnv {
  const apiBaseURL = (source.VITE_API_BASE_URL ?? '').trim()
  // 不依赖 URL 构造器，兼容未提供该 Web API 的小程序与 App 运行环境
  if (apiBaseURL && !/^https?:\/\/(?:\[[\da-f:.]+\]|[^/?#:@\s]+)(?::\d+)?(?:\/[^?#\s]*)?$/i.test(apiBaseURL))
    throw new Error('[env] VITE_API_BASE_URL 必须为空或包含主机的完整 HTTP(S) 地址，不含查询参数或片段')

  const mockFlag = source.VITE_MOCK_ENABLED ?? 'false'
  if (mockFlag !== 'true' && mockFlag !== 'false')
    throw new Error('[env] VITE_MOCK_ENABLED 必须为 true 或 false')

  const authHeaderName = (source.VITE_AUTH_HEADER_NAME ?? 'Authorization').trim()
  if (!/^[!#$%&'*+\-.^`|~\w]+$/.test(authHeaderName))
    throw new Error('[env] VITE_AUTH_HEADER_NAME 必须为非空的 HTTP 请求头名称')

  const rawAuthTokenPrefix = source.VITE_AUTH_TOKEN_PREFIX ?? 'Bearer'
  if (Array.from(rawAuthTokenPrefix).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))
    throw new Error('[env] VITE_AUTH_TOKEN_PREFIX 不能包含控制字符')

  return Object.freeze({
    apiBaseURL: apiBaseURL.replace(/\/+$/, ''),
    requestTimeout: positiveNumber(source.VITE_REQUEST_TIMEOUT, 10_000, 'VITE_REQUEST_TIMEOUT'),
    authHeaderName,
    authTokenPrefix: rawAuthTokenPrefix.trim(),
    mockDelay: positiveNumber(source.VITE_MOCK_DELAY, 500, 'VITE_MOCK_DELAY'),
    mode: source.MODE,
    mockEnabled: source.MODE !== 'production' && mockFlag === 'true',
  })
}

/** 当前 mode 的客户端环境配置 */
export const appEnv = parseAppEnv(import.meta.env)
