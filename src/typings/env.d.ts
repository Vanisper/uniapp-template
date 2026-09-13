interface ImportMetaEnv {
  /** API 根地址，使用完整 HTTP(S) 地址；空值仅用于 Mock 演示 */
  readonly VITE_API_BASE_URL: string
  /** 请求超时毫秒数，有限正数，默认 10000 */
  readonly VITE_REQUEST_TIMEOUT: string
  /** 鉴权请求头名称，默认 Authorization */
  readonly VITE_AUTH_HEADER_NAME: string
  /** Token 前缀，默认 Bearer，空字符串表示不加前缀 */
  readonly VITE_AUTH_TOKEN_PREFIX: string
  /** Token 缓存 key，默认 uniapp-template:auth:token */
  readonly VITE_AUTH_TOKEN_KEY: string
  /** Mock 响应延迟毫秒数，有限正数，默认 500 */
  readonly VITE_MOCK_DELAY: string
  /** 字符串 true 或 false，production 模式强制关闭 */
  readonly VITE_MOCK_ENABLED: string
  /** 字符串 true 或 false，默认开启 Mock 适配器日志 */
  readonly VITE_MOCK_LOG_ENABLED: string
}
