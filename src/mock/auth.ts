import { defineMock } from '@alova/mock'
import { appEnv } from '@/config/env'

/** 创建鉴权示例接口，按实际请求头校验固定体验 Token */
export function createAuthMocks() {
  const authHeaderName = appEnv.authHeaderName.toLowerCase()
  const token = 'mock-demo-token'
  const authorization = appEnv.authTokenPrefix ? `${appEnv.authTokenPrefix} ${token}` : token

  function findAuthHeader(headers: Record<string, unknown>) {
    return Object.keys(headers).find(key => key.toLowerCase() === authHeaderName)
  }

  return defineMock({
    '[POST]/demo/auth/login': ({ data, headers }) => {
      if (data?.username !== 'demo' || data?.password !== 'demo123')
        return { code: 1003, message: '用户名或密码错误', data: null }

      return {
        code: 0,
        message: 'ok',
        data: {
          token,
          user: { id: 1, name: 'Mock体验用户' },
          hasAuthHeader: findAuthHeader(headers) !== undefined,
        },
      }
    },
    '/demo/auth/profile': ({ headers }) => {
      const headerName = findAuthHeader(headers)
      if (headerName === undefined || headers[headerName] !== authorization) {
        return {
          status: 401,
          statusText: 'Unauthorized',
          body: { code: 401, message: '请先登录或重新获取 Token', data: null },
        }
      }

      return { code: 0, message: 'ok', data: { id: 1, name: 'Mock体验用户' } }
    },
    '/demo/auth/public': ({ headers }) => ({
      code: 0,
      message: 'ok',
      data: {
        message: '公共接口可匿名访问',
        hasAuthHeader: findAuthHeader(headers) !== undefined,
      },
    }),
  })
}
