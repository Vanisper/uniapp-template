import { uniappMockResponse, uniappRequestAdapter } from '@alova/adapter-uniapp'
import { createAlovaMockAdapter } from '@alova/mock'
import { createDemoMocks } from './demo'

/** 创建跨端 Mock 适配器；未匹配的请求交给 uni.request，默认延迟 500 毫秒 */
export function createMockAdapter(delay = 500) {
  return createAlovaMockAdapter([createDemoMocks()], {
    httpAdapter: uniappRequestAdapter,
    onMockResponse: uniappMockResponse,
    matchMode: 'methodurl',
    delay,
    mockRequestLogger: false,
  })
}
