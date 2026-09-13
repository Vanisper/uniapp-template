import type { ApiResponse, RequestMeta } from './types'
import { RequestError } from './error'

type UniResponse = UniApp.RequestSuccessCallbackResult | UniApp.UploadFileSuccessCallbackResult | UniApp.DownloadSuccessData

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return typeof value === 'object' && value !== null
    && 'code' in value && (typeof value.code === 'number' || typeof value.code === 'string')
    && 'message' in value && typeof value.message === 'string'
}

/** 检查 HTTP 状态并按请求约定读取响应；204 与下载分别返回 undefined 和完整响应 */
export function resolveResponse(response: UniResponse, meta: RequestMeta = {}, successCode: number | string = 0): unknown {
  const { statusCode } = response
  if (statusCode < 200 || statusCode >= 300) {
    throw new RequestError('http', `请求失败（HTTP ${statusCode}）`, {
      status: statusCode,
      cause: response,
    })
  }

  if (meta.responseMode === 'raw' || 'tempFilePath' in response)
    return response
  if (statusCode === 204)
    return undefined
  if (meta.responseMode === 'body')
    return response.data

  let body: unknown = response.data
  // uni.uploadFile 返回字符串，Mock 和普通 JSON 请求通常返回对象
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    }
    catch {
      throw new RequestError('protocol', '响应不是有效的 JSON', { status: statusCode, cause: body })
    }
  }
  if (!isApiResponse(body)) {
    throw new RequestError('protocol', '响应不符合 { code, message, data } 约定', { status: statusCode, cause: body })
  }
  if (body.code !== successCode) {
    throw new RequestError('business', body.message || '业务请求失败', {
      status: statusCode,
      code: body.code,
      cause: body,
    })
  }
  if (!('data' in body)) {
    throw new RequestError('protocol', '成功响应缺少 data 字段', { status: statusCode, cause: body })
  }
  return body.data
}
