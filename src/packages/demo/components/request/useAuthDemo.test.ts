import type { EffectScope } from 'vue'
import type { AuthDemoLoginResult } from '../../api/auth'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { clearToken, setToken } from '@/auth/token'
import { useAuthDemo } from './useAuthDemo'

const mocks = vi.hoisted(() => ({
  token: undefined as string | undefined,
  loginDemo: vi.fn(),
  getDemoProfile: vi.fn(),
  getDemoPublic: vi.fn(),
}))

vi.mock('../../api/auth', () => ({
  loginDemo: mocks.loginDemo,
  getDemoProfile: mocks.getDemoProfile,
  getDemoPublic: mocks.getDemoPublic,
}))
vi.mock('@/auth/token', () => ({
  getToken: vi.fn(() => mocks.token),
  setToken: vi.fn((token: string) => { mocks.token = token }),
  clearToken: vi.fn(() => { mocks.token = undefined }),
}))
vi.mock('@/http', async () => ({
  isMockEnabled: true,
  RequestError: (await import('@/http/error')).RequestError,
}))

const scopes: EffectScope[] = []

function createDemo() {
  const scope = effectScope()
  scopes.push(scope)
  return { scope, demo: scope.run(useAuthDemo)! }
}

function deferredLogin() {
  const { promise, resolve } = Promise.withResolvers<AuthDemoLoginResult>()
  return {
    method: {
      send: () => promise,
      // 故意让取消后仍可收到响应，验证缓存保护不依赖底层取消成功
      abort: vi.fn(() => Promise.resolve()),
    },
    resolve(token: string, name: string) {
      resolve({ token, user: { id: 1, name }, hasAuthHeader: false })
    },
  }
}

beforeEach(() => {
  mocks.token = undefined
  mocks.loginDemo.mockReset()
})
afterEach(() => {
  for (const scope of scopes.splice(0))
    scope.stop()
})

describe('鉴权 Mock 示例的登录生命周期', () => {
  it('退出后可以重新登录，旧登录的迟到响应不能写入 Token 或覆盖新结果', async () => {
    const oldLogin = deferredLogin()
    const newLogin = deferredLogin()
    mocks.loginDemo.mockReturnValueOnce(oldLogin.method).mockReturnValueOnce(newLogin.method)
    const { demo } = createDemo()

    const oldPending = demo.login()
    demo.logout()
    expect(clearToken).toHaveBeenCalledOnce()
    expect(oldLogin.method.abort).toHaveBeenCalledOnce()
    expect(mocks.token).toBeUndefined()

    const newPending = demo.login()
    newLogin.resolve('new-session', '新用户')
    await newPending
    expect(mocks.token).toBe('new-session')
    expect(demo.hasToken.value).toBe(true)
    const newResult = demo.loginResult.value

    oldLogin.resolve('old-session', '旧用户')
    await oldPending
    expect(setToken).toHaveBeenCalledExactlyOnceWith('new-session')
    expect(mocks.token).toBe('new-session')
    expect(demo.loginResult.value).toEqual(newResult)
  })

  it('作用域卸载后，即使在途登录成功返回也不能把 Token 写入缓存', async () => {
    const login = deferredLogin()
    mocks.loginDemo.mockReturnValueOnce(login.method)
    const { scope, demo } = createDemo()

    const pending = demo.login()
    scope.stop()
    expect(login.method.abort).toHaveBeenCalledOnce()

    login.resolve('late-session', '离开的用户')
    await pending
    expect(setToken).not.toHaveBeenCalled()
    expect(mocks.token).toBeUndefined()
    expect(demo.hasToken.value).toBe(false)
  })
})
