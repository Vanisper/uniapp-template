import { defineMock } from '@alova/mock'

/** 创建请求示例的 Mock 分组，调用时才注册数据 */
export function createDemoMocks() {
  return defineMock({
    '/demo/request': ({ query }) => {
      if (query.scenario === 'business-error')
        return { code: 1001, message: '这是一次模拟业务失败，请切换成功场景重试', data: null }
      if (query.scenario === 'http-error') {
        return {
          status: 503,
          statusText: 'Service Unavailable',
          body: { code: 503, message: '模拟服务暂时不可用', data: null },
        }
      }
      return {
        code: 0,
        message: 'ok',
        data: {
          message: '已通过 alova 获取 Mock 数据',
          items: query.scenario === 'empty'
            ? []
            : [
                { id: 1, title: '统一响应解包' },
                { id: 2, title: '请求取消与错误处理' },
                { id: 3, title: 'H5 与小程序共用 Mock' },
              ],
        },
      }
    },
    '[POST]/demo/request': ({ data }) => {
      const message = typeof data?.message === 'string' ? data.message.trim() : ''
      return message
        ? { code: 0, message: 'ok', data: { message } }
        : { code: 1002, message: '请输入要发送的内容', data: null }
    },
  })
}
