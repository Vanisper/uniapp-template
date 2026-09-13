import { defineMock } from '@alova/mock'

/** 创建公共请求头示例接口，只回显租户 ID，不验证租户权限 */
export function createHeaderMocks() {
  return defineMock({
    '/demo/headers': ({ headers }) => {
      const headerName = Object.keys(headers).find(key => key.toLowerCase() === 'x-tenant-id')
      const value = headerName === undefined ? undefined : headers[headerName]

      return {
        code: 0,
        message: 'ok',
        data: { tenantId: value == null ? null : String(value) },
      }
    },
  })
}
