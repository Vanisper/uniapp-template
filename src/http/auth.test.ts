import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const delay = 20
const storage = new Map<string, unknown>()
const requestHeaders: Record<string, unknown>[] = []
const request = vi.fn((options: UniApp.RequestOptions) => {
  requestHeaders.push({ ...options.header })
  options.success?.({ statusCode: 200, data: { code: 0, message: 'ok', data: 'real endpoint' }, header: {}, cookies: [], errMsg: 'request:ok' })
  return { abort: vi.fn() }
})

interface LoginData {
  token: string
  user: { id: number, name: string }
  hasAuthHeader: boolean
}

async function loadModules(env: Record<string, string> = {}) {
  for (const [key, value] of Object.entries({
    MODE: 'development',
    VITE_API_BASE_URL: 'https://api.example.test/v1',
    VITE_REQUEST_TIMEOUT: '1000',
    VITE_AUTH_HEADER_NAME: 'Authorization',
    VITE_AUTH_TOKEN_PREFIX: 'Bearer',
    VITE_AUTH_TOKEN_KEY: 'uniapp-template:auth:token',
    VITE_MOCK_ENABLED: 'true',
    VITE_MOCK_DELAY: String(delay),
    VITE_MOCK_LOG_ENABLED: 'false',
    ...env,
  })) {
    vi.stubEnv(key, value)
  }
  vi.resetModules()
  const [{ http, isMockEnabled }, token] = await Promise.all([import('./index'), import('@/auth/token')])
  return { http, isMockEnabled, ...token }
}

async function receiveMock<T>(pending: Promise<T>): Promise<T> {
  const result = pending.then(data => ({ ok: true as const, data }), error => ({ ok: false as const, error }))
  await vi.advanceTimersByTimeAsync(delay)
  const settled = await result
  if (!settled.ok)
    throw settled.error
  return settled.data
}

beforeEach(() => {
  vi.useFakeTimers()
  storage.clear()
  requestHeaders.length = 0
  vi.stubGlobal('uni', {
    request,
    getStorageSync: (key: string) => storage.get(key),
    setStorageSync: (key: string, value: unknown) => storage.set(key, value),
    removeStorageSync: (key: string) => storage.delete(key),
  })
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('公共客户端的 Token 与鉴权 Mock', () => {
  it.each([
    { title: '默认鉴权配置', header: 'Authorization', prefix: 'Bearer', key: 'uniapp-template:auth:token' },
    { title: '自定义鉴权头和缓存键', header: 'X-Session', prefix: 'Session', key: 'tenant:session' },
    { title: '无前缀 Token', header: 'X-Token', prefix: '', key: 'tenant:token' },
  ])('$title 支持登录、匿名访问和退出后的 401', async ({ header, prefix, key }) => {
    const { http, getToken, setToken, clearToken } = await loadModules({
      VITE_AUTH_HEADER_NAME: header,
      VITE_AUTH_TOKEN_PREFIX: prefix,
      VITE_AUTH_TOKEN_KEY: key,
    })
    storage.set('unrelated', 'retained')
    expect(getToken()).toBeUndefined()

    const login = await receiveMock(http.Post<LoginData>('/demo/auth/login', { username: 'demo', password: 'demo123' }, { meta: { auth: false } }).send())
    expect(login.hasAuthHeader).toBe(false)
    setToken(login.token)
    expect(getToken() === login.token).toBe(true)
    expect([...storage.keys()].sort()).toEqual([key, 'unrelated'].sort())

    const profile = http.Get('/demo/auth/profile')
    await expect(receiveMock(profile.send())).resolves.toEqual(login.user)
    await expect(receiveMock(http.Get('/demo/auth/public', { meta: { auth: false } }).send())).resolves.toEqual({
      message: '公共接口可匿名访问',
      hasAuthHeader: false,
    })

    const relogin = await receiveMock(http.Post<LoginData>('/demo/auth/login', { username: 'demo', password: 'demo123' }, { meta: { auth: false } }).send())
    expect(relogin.hasAuthHeader).toBe(false)

    clearToken()
    expect(getToken()).toBeUndefined()
    expect(storage.has(key)).toBe(false)
    expect(storage.get('unrelated')).toBe('retained')
    const assertion = expect(profile.send()).rejects.toMatchObject({ kind: 'http', status: 401 })
    await vi.advanceTimersByTimeAsync(delay)
    await assertion
    expect(request).not.toHaveBeenCalled()
  })

  it('缓存 Token 时清理空白，拒绝空值时保留原缓存，忽略非字符串缓存', async () => {
    const key = 'custom:auth:token'
    const { getToken, setToken, clearToken } = await loadModules({ VITE_AUTH_TOKEN_KEY: key })
    setToken('  test-session  ')
    expect(getToken() === 'test-session').toBe(true)
    expect(storage.get(key) === 'test-session').toBe(true)
    expect(() => setToken('   ')).toThrow('Token 不能为空')
    expect(getToken() === 'test-session').toBe(true)

    storage.set(key, { stale: true })
    expect(getToken()).toBeUndefined()
    clearToken()
    expect(storage.has(key)).toBe(false)
  })

  it.each(['true', 'false'])('模拟开关为 %s 时，真实请求重发读取最新 Token 并移除旧头', async (mockEnabled) => {
    const header = 'X-Session'
    const { http, setToken, clearToken, isMockEnabled } = await loadModules({
      VITE_MOCK_ENABLED: mockEnabled,
      VITE_AUTH_HEADER_NAME: header,
      VITE_AUTH_TOKEN_PREFIX: '',
    })
    expect(isMockEnabled).toBe(mockEnabled === 'true')
    const path = isMockEnabled ? '/unmocked' : '/demo/auth/profile'
    const method = http.Get(path, { headers: { 'x-session': 'stale', 'X-Client': 'test' } })

    for (const [index, value] of ['first-session', 'second-session'].entries()) {
      setToken(value)
      await expect(method.send()).resolves.toBe('real endpoint')
      expect(Object.keys(requestHeaders[index]!).sort()).toEqual(['X-Client', header])
      expect(requestHeaders[index]![header] === value).toBe(true)
    }

    clearToken()
    await expect(method.send()).resolves.toBe('real endpoint')
    expect(requestHeaders[2]).toEqual({ 'X-Client': 'test' })
    expect(request).toHaveBeenCalledTimes(3)
  })
})
