import type { LoggerMockRequestResponse } from '@alova/mock'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMockLogger } from './logger'

function createLog(overrides: Partial<LoggerMockRequestResponse> = {}): LoggerMockRequestResponse {
  return {
    isMock: true,
    method: 'POST',
    url: '/auth/login',
    headers: {},
    query: {},
    params: {},
    data: {},
    responseHeaders: {},
    response: {},
    ...overrides,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('请求 Mock 日志', () => {
  it('递归脱敏请求与响应的敏感字段，兼容大小写和分隔符且不修改原始数据', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const input = createLog({
      headers: { 'AUTHORIZATION': 'Bearer original', 'X-Auth-Key': 'custom-original', 'Accept': 'application/json' },
      query: { 'Access-Token': 'query-original', 'page': 1 },
      params: { pwd: 'params-original', id: 'user-1' },
      data: {
        username: 'demo',
        Password: 'password-original',
        accounts: [{ passwd: 'passwd-original', refreshToken: 'refresh-original', profile: { secret: 'secret-original' } }],
      },
      responseHeaders: { 'Set-Cookie': 'cookie-original', 'content-type': 'application/json' },
      response: { token: 'token-original', COOKIE: 'response-cookie', api_key: 'api-original', x_auth_key: 'response-custom' },
    })
    const before = structuredClone(input)

    createMockLogger(' x-auth-key ')(input)

    expect(info).toHaveBeenCalledWith('[Mock] POST /auth/login', {
      request: {
        headers: { 'AUTHORIZATION': '[REDACTED]', 'X-Auth-Key': '[REDACTED]', 'Accept': '[REDACTED]' },
        query: { 'Access-Token': '[REDACTED]', 'page': 1 },
        params: { pwd: '[REDACTED]', id: 'user-1' },
        data: {
          username: 'demo',
          Password: '[REDACTED]',
          accounts: [{ passwd: '[REDACTED]', refreshToken: '[REDACTED]', profile: { secret: '[REDACTED]' } }],
        },
      },
      response: {
        headers: { 'Set-Cookie': '[REDACTED]', 'content-type': '[REDACTED]' },
        data: { token: '[REDACTED]', COOKIE: '[REDACTED]', api_key: '[REDACTED]', x_auth_key: '[REDACTED]' },
      },
    })
    expect(input).toEqual(before)
  })

  it('任意请求头与响应头均只保留名称，普通查询参数和正文仍可查看', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const input = createLog({
      headers: { 'X-Session': 'instance-session', 'X-Trace': 'request-trace' },
      query: { page: 2, token: 'query-token' },
      data: { title: '普通参数', password: 'hidden-password' },
      responseHeaders: { 'X-Custom-Credential': 'response-session' },
      response: { title: '返回数据' },
    })

    createMockLogger('Authorization')(input)

    expect(info).toHaveBeenCalledWith(expect.any(String), {
      request: {
        headers: { 'X-Session': '[REDACTED]', 'X-Trace': '[REDACTED]' },
        query: { page: 2, token: '[REDACTED]' },
        data: { title: '普通参数', password: '[REDACTED]' },
        params: {},
      },
      response: { headers: { 'X-Custom-Credential': '[REDACTED]' }, data: { title: '返回数据' } },
    })
    expect(input.headers['X-Session']).toBe('instance-session')
    expect(input.responseHeaders['X-Custom-Credential']).toBe('response-session')
  })

  it('解析 JSON 请求体和响应体后脱敏，保留普通文本', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const input = createLog({
      data: ' {"password":"request-original","message":"hello"}',
      response: '[{"access_token":"response-original","message":"{invalid json"}]',
    })

    createMockLogger('Authorization')(input)

    expect(info).toHaveBeenCalledWith(expect.any(String), {
      request: { headers: {}, query: {}, params: {}, data: { password: '[REDACTED]', message: 'hello' } },
      response: { headers: {}, data: [{ access_token: '[REDACTED]', message: '{invalid json' }] },
    })
    expect(input.data).toBe(' {"password":"request-original","message":"hello"}')
    expect(input.response).toBe('[{"access_token":"response-original","message":"{invalid json"}]')
  })

  it('隐藏 URL 中敏感查询值并保留其余路径和参数', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const input = createLog({
      url: 'https://api.example.test/login?access%5Ftoken=original&X-Auth-Key=custom&token=another&page=2&%ZZ=invalid#details',
    })

    createMockLogger('x_auth_key')(input)

    expect(info).toHaveBeenCalledWith(
      '[Mock] POST https://api.example.test/login?access%5Ftoken=[REDACTED]&X-Auth-Key=[REDACTED]&token=[REDACTED]&page=2&%ZZ=invalid#details',
      expect.any(Object),
    )
    expect(input.url).toContain('access%5Ftoken=original')
  })

  it.each([
    { isMock: true, label: 'Mock' },
    { isMock: false, label: 'HTTP' },
  ])('使用 $label 标签标识请求来源', ({ isMock, label }) => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    createMockLogger('Authorization')(createLog({ isMock, method: 'GET', url: '/users' }))

    expect(info).toHaveBeenCalledWith(`[${label}] GET /users`, expect.any(Object))
  })

  it('用占位符表示循环引用，重复引用仍可正常展示', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const shared = { name: 'demo', token: 'original' }
    const body: Record<string, unknown> = { accounts: [shared, shared] }
    body.self = body

    createMockLogger('Authorization')(createLog({ data: body }))

    expect(info).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      request: expect.objectContaining({
        data: { accounts: [{ name: 'demo', token: '[REDACTED]' }, { name: 'demo', token: '[REDACTED]' }], self: '[Circular]' },
      }),
    }))
    expect(body.self).toBe(body)
    expect(shared.token).toBe('original')
  })

  it('控制台不可用时不抛出异常', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {
      throw new Error('console unavailable')
    })

    expect(() => createMockLogger('Authorization')(createLog())).not.toThrow()
  })
})
