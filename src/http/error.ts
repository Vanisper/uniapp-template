/** 请求失败的分类，可用于分别处理取消、重试与业务提示 */
export type RequestErrorKind = 'http' | 'business' | 'network' | 'timeout' | 'abort' | 'protocol'

/** 请求错误的附加信息 */
export interface RequestErrorDetails {
  /** HTTP 状态码，未收到响应时不存在 */
  status?: number
  /** 服务端业务码 */
  code?: number | string
  /** 原始响应体或底层异常 */
  cause?: unknown
}

/** 请求失败时抛出的统一异常 */
export class RequestError extends Error {
  readonly kind: RequestErrorKind
  readonly status?: number
  readonly code?: number | string

  constructor(kind: RequestErrorKind, message: string, details: RequestErrorDetails = {}) {
    super(message, { cause: details.cause })
    this.name = 'RequestError'
    this.kind = kind
    this.status = details.status
    this.code = details.code
  }
}

/** 将底层异常归一化，已归一化的错误保持原实例 */
export function toRequestError(error: unknown): RequestError {
  if (error instanceof RequestError)
    return error

  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'errMsg' in error
      ? String(error.errMsg)
      : typeof error === 'string' ? error : '网络请求失败，请稍后重试'
  const kind = /abort|cancel/i.test(message)
    ? 'abort'
    : /timeout|timed out/i.test(message) ? 'timeout' : 'network'
  return new RequestError(kind, message, { cause: error })
}
