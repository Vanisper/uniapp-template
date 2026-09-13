import { uniappMockResponse, uniappRequestAdapter } from '@alova/adapter-uniapp'
import { createAlovaMockAdapter } from '@alova/mock'
import { appEnv } from '@/config/env'
import { createAuthMocks } from './auth'
import { createDemoMocks } from './demo'
import { createHeaderMocks } from './headers'
import { createMockLogger } from './logger'

/** 创建跨端 Mock 适配器；未匹配请求交给 uni.request，日志开关默认使用环境配置 */
export function createMockAdapter(delay = 500, logEnabled = appEnv.mockLogEnabled) {
  return createAlovaMockAdapter([createDemoMocks(), createAuthMocks(), createHeaderMocks()], {
    httpAdapter: uniappRequestAdapter,
    onMockResponse: uniappMockResponse,
    matchMode: 'methodurl',
    delay,
    mockRequestLogger: logEnabled ? createMockLogger(appEnv.authHeaderName) : false,
  })
}
