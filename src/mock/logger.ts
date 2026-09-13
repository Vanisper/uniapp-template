import type { MockRequestLoggerAdapter } from '@alova/mock'

const redacted = '[REDACTED]'
const sensitiveFields = [
  'password',
  'passwd',
  'pwd',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'set-cookie',
  'secret',
  'api-key',
]

function normalizeField(field: string): string {
  return field.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * 创建请求日志回调，递归隐藏敏感字段并保留原始数据
 *
 * @description 请求头与响应头仅保留名称，日志处理失败不会中断请求
 */
export function createMockLogger(authHeaderName: string): MockRequestLoggerAdapter {
  const sensitive = new Set([...sensitiveFields, authHeaderName].map(normalizeField).filter(Boolean))

  function redact(value: unknown, ancestors = new WeakSet<object>()): unknown {
    if (typeof value === 'string' && /^[{[]/.test(value.trim())) {
      try {
        return redact(JSON.parse(value), ancestors)
      }
      catch {
        return value
      }
    }
    if (!value || typeof value !== 'object') {
      return value
    }
    if (ancestors.has(value)) {
      return '[Circular]'
    }

    ancestors.add(value)
    const result = Array.isArray(value)
      ? value.map(item => redact(item, ancestors))
      : Object.fromEntries(Object.entries(value).map(([key, item]) => [
          key,
          sensitive.has(normalizeField(key)) ? redacted : redact(item, ancestors),
        ]))
    ancestors.delete(value)
    return result
  }

  function redactUrl(url: string): string {
    return url.replace(/([?&])([^=&#]+)=([^&#]*)/g, (match, separator: string, key: string) => {
      let decodedKey = key
      try {
        decodedKey = decodeURIComponent(key.replace(/\+/g, ' '))
      }
      catch {
        // 非法编码仍按原始字段名检查
      }
      return sensitive.has(normalizeField(decodedKey)) ? `${separator}${key}=${redacted}` : match
    })
  }

  function redactHeaders(headers: Record<string, unknown>) {
    return Object.fromEntries(Object.keys(headers).map(key => [key, redacted]))
  }

  return ({ isMock, method, url, headers, query, params, data, responseHeaders, response }) => {
    try {
      // eslint-disable-next-line no-console -- 使用普通日志兼容小程序控制台
      console.info(`[${isMock ? 'Mock' : 'HTTP'}] ${method} ${redactUrl(url)}`, {
        request: redact({ headers: redactHeaders(headers), query, params, data }),
        response: redact({ headers: redactHeaders(responseHeaders), data: response }),
      })
    }
    catch {
      // 日志异常不能影响请求流程
    }
  }
}
