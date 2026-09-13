import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHttpClient } from '@/http/client'
import { createMockAdapter } from './index'

const delay = 10
const request = vi.fn()
const user = { id: 1, name: 'Mock体验用户' }

function createClient(getToken?: () => string | undefined) {
  return createHttpClient({
    baseURL: 'https://api.example.test/v1',
    getToken,
    requestAdapter: createMockAdapter(delay, false),
  })
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
})

describe('鉴权 Mock 接口', () => {
  it('正确凭证返回体验 Token，存储与登录状态完全由调用方管理', async () => {
    let token: string | undefined
    const client = createClient(() => token)
    const login = client.Post('/demo/auth/login', { username: 'demo', password: 'demo123' }, { meta: { auth: false } }).send()
    await vi.advanceTimersByTimeAsync(delay)
    await expect(login).resolves.toEqual({ token: 'mock-demo-token', user, hasAuthHeader: false })

    const beforeSaving = client.Get('/demo/auth/profile').send()
    const unauthorized = expect(beforeSaving).rejects.toMatchObject({ kind: 'http', status: 401 })
    await vi.advanceTimersByTimeAsync(delay)
    await unauthorized

    token = 'mock-demo-token'
    const profile = client.Get('/demo/auth/profile').send()
    await vi.advanceTimersByTimeAsync(delay)
    await expect(profile).resolves.toEqual(user)
    expect(request).not.toHaveBeenCalled()
  })

  it.each([
    { username: 'demo', password: 'wrong' },
    { username: 'other', password: 'demo123' },
    {},
  ])('错误或缺失凭证返回业务失败 $username', async (credentials) => {
    const login = createClient().Post('/demo/auth/login', credentials).send()
    const rejected = expect(login).rejects.toMatchObject({ kind: 'business', code: 1003, message: '用户名或密码错误' })
    await vi.advanceTimersByTimeAsync(delay)
    await rejected
  })

  it('退出后同一 Method 不再通过鉴权，匿名接口按实际头部报告状态', async () => {
    let token: string | undefined = 'mock-demo-token'
    const client = createClient(() => token)
    const method = client.Get('/demo/auth/profile')
    const profile = method.send()
    await vi.advanceTimersByTimeAsync(delay)
    await expect(profile).resolves.toEqual(user)

    const publicRequest = client.Get('/demo/auth/public').send()
    const anonymous = client.Get('/demo/auth/public', { meta: { auth: false } }).send()
    await vi.advanceTimersByTimeAsync(delay)
    await expect(publicRequest).resolves.toEqual({ message: '公共接口可匿名访问', hasAuthHeader: true })
    await expect(anonymous).resolves.toEqual({ message: '公共接口可匿名访问', hasAuthHeader: false })

    token = undefined
    const signedOut = method.send()
    const rejected = expect(signedOut).rejects.toMatchObject({ kind: 'http', status: 401 })
    await vi.advanceTimersByTimeAsync(delay)
    await rejected
  })

  it('错误 Token、错误前缀和错误请求头均返回 HTTP 401', async () => {
    const client = createClient()
    for (const headers of [
      { Authorization: 'Bearer wrong-token' },
      { Authorization: 'mock-demo-token' },
      { 'X-Wrong-Header': 'Bearer mock-demo-token' },
    ]) {
      const profile = client.Get('/demo/auth/profile', { headers }).send()
      const rejected = expect(profile).rejects.toMatchObject({ kind: 'http', status: 401 })
      await vi.advanceTimersByTimeAsync(delay)
      await rejected
    }
  })

  it.each(['Session', ''])('继承环境请求头和前缀 %j，匹配头名时忽略大小写', async (prefix) => {
    vi.stubEnv('VITE_AUTH_HEADER_NAME', 'X-Session')
    vi.stubEnv('VITE_AUTH_TOKEN_PREFIX', prefix)
    vi.resetModules()
    const { createHttpClient: createConfiguredClient } = await import('@/http/client')
    const { createMockAdapter: createConfiguredAdapter } = await import('./index')
    const client = createConfiguredClient({ baseURL: '', requestAdapter: createConfiguredAdapter(delay, false) })
    const headers = { 'x-session': prefix ? `${prefix} mock-demo-token` : 'mock-demo-token' }
    const profile = client.Get('/demo/auth/profile', { headers }).send()
    const login = client.Post('/demo/auth/login', { username: 'demo', password: 'demo123' }, { headers }).send()
    await vi.advanceTimersByTimeAsync(delay)
    await expect(profile).resolves.toEqual(user)
    await expect(login).resolves.toMatchObject({ hasAuthHeader: true })
    expect(request).not.toHaveBeenCalled()
  })
})
