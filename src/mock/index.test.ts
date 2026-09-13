import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHttpClient } from '@/http/client'
import { createMockAdapter } from './index'

const delay = 20
const request = vi.fn((options: UniApp.RequestOptions) => {
  options.success?.({ statusCode: 200, data: { code: 0, message: 'ok', data: 'real endpoint' }, header: {}, cookies: [], errMsg: 'request:ok' })
  return { abort: vi.fn() }
})

function createClient(logEnabled = false) {
  return createHttpClient({ baseURL: 'https://api.example.test/v1', requestAdapter: createMockAdapter(delay, logEnabled) })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('uni', { request })
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('跨端 Mock 集成', () => {
  it.each(['success', 'empty'])('匹配带 API 前缀的 GET 和 %s 查询场景', async (scenario) => {
    const pending = createClient().Get<{ message: string, items: unknown[] }>('/demo/request', { params: { scenario } }).send()
    await vi.advanceTimersByTimeAsync(delay)
    const result = await pending
    expect(result.message).toContain('Mock')
    expect(result.items).toHaveLength(scenario === 'empty' ? 0 : 3)
    expect(request).not.toHaveBeenCalled()
  })

  it.each([
    { scenario: 'business-error', error: { kind: 'business', code: 1001 } },
    { scenario: 'http-error', error: { kind: 'http', status: 503 } },
  ])('$scenario 经过统一错误处理', async ({ scenario, error }) => {
    const pending = createClient().Get('/demo/request', { params: { scenario } }).send()
    const assertion = expect(pending).rejects.toMatchObject(error)
    await vi.advanceTimersByTimeAsync(delay)
    await assertion
    expect(request).not.toHaveBeenCalled()
  })

  it('通过 POST 读取请求体并校验空白消息', async () => {
    const client = createClient()
    const success = client.Post('/demo/request', { message: '  你好 Mock  ' }).send()
    const invalid = client.Post('/demo/request', { message: '   ' }).send()
    const assertion = expect(invalid).rejects.toMatchObject({ kind: 'business', code: 1002 })
    await vi.advanceTimersByTimeAsync(delay)
    await expect(success).resolves.toEqual({ message: '你好 Mock' })
    await assertion
    expect(request).not.toHaveBeenCalled()
  })

  it('未匹配路径或请求方法时转发到 uni.request', async () => {
    const client = createClient()
    await expect(client.Get('/unmocked', { params: { page: 2 } }).send()).resolves.toBe('real endpoint')
    await expect(client.Delete('/demo/request').send()).resolves.toBe('real endpoint')
    expect(request).toHaveBeenCalledTimes(2)
    expect(request).toHaveBeenNthCalledWith(1, expect.objectContaining({ url: 'https://api.example.test/v1/unmocked?page=2', method: 'GET' }))
    expect(request).toHaveBeenNthCalledWith(2, expect.objectContaining({ method: 'DELETE' }))
  })

  it('延迟中的 Mock 可取消，取消后再次发送可成功', async () => {
    const method = createClient().Get('/demo/request')
    const pending = method.send()
    const assertion = expect(pending).rejects.toMatchObject({ kind: 'abort' })
    await vi.advanceTimersByTimeAsync(1)
    method.abort()
    await assertion

    const retry = method.send()
    await vi.advanceTimersByTimeAsync(delay)
    await expect(retry).resolves.toMatchObject({ items: expect.any(Array) })
    expect(request).not.toHaveBeenCalled()
  })

  it('模拟请求遵守单次请求超时，并保留 timeout 分类', async () => {
    const pending = createClient().Get('/demo/request', { timeout: 5 }).send()
    const assertion = expect(pending).rejects.toMatchObject({ kind: 'timeout' })
    await vi.advanceTimersByTimeAsync(delay)
    await assertion
    expect(request).not.toHaveBeenCalled()
  })

  it('日志关闭时不打印，开启后标明 Mock 响应与真实请求回退', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const silent = createClient().Get('/demo/request').send()
    await vi.advanceTimersByTimeAsync(delay)
    await silent
    expect(info).not.toHaveBeenCalled()

    const client = createClient(true)
    const mocked = client.Get('/demo/request').send()
    await vi.advanceTimersByTimeAsync(delay)
    await mocked
    await client.Get('/unmocked').send()
    expect(info.mock.calls.map(call => call[0])).toEqual([
      expect.stringMatching(/^\[Mock\].*GET.*\/demo\/request/),
      expect.stringMatching(/^\[HTTP\].*GET.*\/unmocked/),
    ])
  })

  it('默认读取环境日志开关，关闭日志后仍正常处理 Mock 和真实请求', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.stubEnv('VITE_MOCK_LOG_ENABLED', 'false')
    vi.resetModules()
    const { createMockAdapter: createConfiguredAdapter } = await import('./index')
    const client = createHttpClient({ baseURL: '', requestAdapter: createConfiguredAdapter(delay) })
    const mocked = client.Get('/demo/request').send()
    await vi.advanceTimersByTimeAsync(delay)
    await expect(mocked).resolves.toMatchObject({ items: expect.any(Array) })
    await expect(client.Get('/unmocked').send()).resolves.toBe('real endpoint')
    expect(info).not.toHaveBeenCalled()
  })

  it('客户端覆盖鉴权头时隐藏实际 Token，同时保留请求中的完整认证信息', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})
    const token = 'instance-session-marker'
    const mockAdapter = createMockAdapter(delay, true)
    const sentHeaders: Record<string, unknown>[] = []
    const client = createHttpClient({
      baseURL: 'https://api.example.test/v1',
      authHeaderName: 'X-Session',
      authTokenPrefix: '',
      getToken: () => token,
      requestAdapter(elements, method) {
        sentHeaders.push(elements.headers)
        return mockAdapter(elements, method)
      },
    })
    const method = client.Get('/demo/request', { params: { scenario: 'empty' } })
    const pending = method.send()
    await vi.advanceTimersByTimeAsync(delay)
    await expect(pending).resolves.toMatchObject({ items: [] })

    expect(sentHeaders[0]?.['X-Session']).toBe(token)
    expect(info).toHaveBeenCalledWith(expect.stringMatching(/^\[Mock\]/), expect.objectContaining({
      request: expect.objectContaining({
        headers: { 'X-Session': '[REDACTED]' },
        query: { scenario: 'empty' },
      }),
    }))
    expect(JSON.stringify(info.mock.calls)).not.toContain(token)
    expect(request).not.toHaveBeenCalled()
  })
})
