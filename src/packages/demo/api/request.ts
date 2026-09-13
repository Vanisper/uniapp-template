import { http } from '@/http'

/** 请求示例支持的响应场景 */
export type RequestDemoScenario = 'success' | 'empty' | 'business-error' | 'http-error'

/** 请求示例的列表数据 */
export interface RequestDemoData {
  message: string
  items: { id: number, title: string }[]
}

/** 按场景获取示例列表 */
export function getRequestDemo(scenario: RequestDemoScenario = 'success') {
  return http.Get<RequestDemoData>('/demo/request', { params: { scenario } })
}

/** 提交一段文本并获取服务端回显 */
export function postRequestDemo(message: string) {
  return http.Post<{ message: string }>('/demo/request', { message })
}
