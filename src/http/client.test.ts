import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHttpClient } from './client'
import { RequestError } from './error'

const requests: UniApp.RequestOptions[] = []
const request = vi.fn((options: UniApp.RequestOptions) => {
  requests.push({ ...options, header: { ...options.header } })
  return { abort: () => options.fail?.({ errMsg: 'request:fail abort' }) }
})
const uploadFile = vi.fn((options: UniApp.UploadFileOption) => {
  options.success?.({ statusCode: 200, data: JSON.stringify({ code: 0, message: 'ok', data: { id: 'file-1' } }) })
  return { abort: vi.fn(), onProgressUpdate: vi.fn() }
})
const downloadFile = vi.fn((options: UniApp.DownloadFileOption) => {
  options.success?.({ statusCode: 200, tempFilePath: '/tmp/download.pdf' })
  return { abort: vi.fn(), onProgressUpdate: vi.fn() }
})

function respond(index: number, data: unknown = { code: 0, message: 'ok', data: { id: 1 } }, statusCode = 200) {
  const response = { data, statusCode, header: { 'x-request-id': 'request-1' }, cookies: [], errMsg: 'request:ok' }
  requests[index]!.success?.(response as UniApp.RequestSuccessCallbackResult)
  return response
}

beforeEach(() => {
  requests.length = 0
  vi.stubGlobal('uni', { request, uploadFile, downloadFile })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('真实 alova 与 uni-app 适配器', () => {
  it('发送 URL、参数和超时配置，并解包业务数据', async () => {
    const client = createHttpClient({ baseURL: 'https://api.example.test/v1', timeout: 3000 })
    const pending = client.Get<{ id: number }>('/items', { params: { page: 2 } }).send()
    await vi.waitFor(() => expect(requests).toHaveLength(1))

    expect(requests[0]).toMatchObject({ url: 'https://api.example.test/v1/items?page=2', method: 'GET', timeout: 3000 })
    respond(0)
    await expect(pending).resolves.toEqual({ id: 1 })
  })

  it.each([
    { title: 'HTTP 失败', status: 503, body: { message: 'unavailable' }, error: { kind: 'http', status: 503 } },
    { title: '业务失败', status: 200, body: { code: 1001, message: '余额不足', data: null }, error: { kind: 'business', code: 1001, message: '余额不足' } },
    { title: '成功响应缺少 data', status: 200, body: { code: 0, message: 'ok' }, error: { kind: 'protocol' } },
    { title: '无效 JSON', status: 200, body: '<html>error</html>', error: { kind: 'protocol' } },
    { title: '成功码类型不符', status: 200, body: { code: '0', message: 'ok', data: null }, error: { kind: 'business', code: '0' } },
  ])('$title 始终拒绝 Promise', async ({ status, body, error }) => {
    const pending = createHttpClient({ baseURL: '' }).Get('/items').send()
    const assertion = expect(pending).rejects.toMatchObject({ name: 'RequestError', ...error })
    await vi.waitFor(() => expect(requests).toHaveLength(1))
    respond(0, body, status)
    await assertion
  })

  it('支持配置字符串成功码，并保留 null 数据', async () => {
    const pending = createHttpClient({ baseURL: '', successCode: 'OK' }).Get('/items').send()
    await vi.waitFor(() => expect(requests).toHaveLength(1))
    respond(0, { code: 'OK', message: 'ok', data: null })
    await expect(pending).resolves.toBeNull()
  })

  it('body 与 raw 保留对应响应层级，204 返回 undefined', async () => {
    const client = createHttpClient({ baseURL: '' })
    const body = client.Get('/body', { meta: { responseMode: 'body' } }).send()
    const raw = client.Get('/raw', { meta: { responseMode: 'raw' } }).send()
    const empty = client.Delete('/empty').send()
    await vi.waitFor(() => expect(requests).toHaveLength(3))
    respond(0, 'plain text')
    const response = respond(1, { external: true })
    respond(2, '', 204)
    await expect(body).resolves.toBe('plain text')
    await expect(raw).resolves.toEqual(response)
    await expect(empty).resolves.toBeUndefined()
  })

  it('raw 模式仍检查 HTTP 状态', async () => {
    const pending = createHttpClient({ baseURL: '' }).Get('/raw', { meta: { responseMode: 'raw' } }).send()
    const assertion = expect(pending).rejects.toMatchObject({ kind: 'http', status: 401 })
    await vi.waitFor(() => expect(requests).toHaveLength(1))
    respond(0, {}, 401)
    await assertion
  })

  it('上传解包 JSON 字符串，下载保留文件路径和状态', async () => {
    const client = createHttpClient({ baseURL: 'https://api.example.test' })
    await expect(client.Post('/files', { filePath: '/tmp/photo.png', name: 'file', category: 'avatar' }, { requestType: 'upload' }).send()).resolves.toEqual({ id: 'file-1' })
    expect(uploadFile).toHaveBeenCalledWith(expect.objectContaining({ filePath: '/tmp/photo.png', name: 'file', formData: { category: 'avatar' } }))
    await expect(client.Get('/files/1', { requestType: 'download' }).send()).resolves.toEqual({ statusCode: 200, tempFilePath: '/tmp/download.pdf' })
    expect(downloadFile).toHaveBeenCalledOnce()
    expect(request).not.toHaveBeenCalled()
  })

  it('每次发送读取当前 Token，退出移除认证头，auth=false 保留调用方认证', async () => {
    let token: string | undefined = 'first'
    const getToken = vi.fn(() => token)
    const client = createHttpClient({ baseURL: '', getToken })
    const method = client.Get('/private', { headers: { 'authorization': 'stale', 'X-Client': 'demo' } })
    for (const [index, currentToken] of ['first', 'second', undefined].entries()) {
      token = currentToken
      const pending = method.send()
      await vi.waitFor(() => expect(requests).toHaveLength(index + 1))
      expect(requests[index]!.header).toEqual({ 'X-Client': 'demo', ...(token ? { Authorization: `Bearer ${token}` } : {}) })
      respond(index)
      await pending
    }

    const publicRequest = client.Get('/public', { meta: { auth: false }, headers: { Authorization: 'Basic custom' } }).send()
    await vi.waitFor(() => expect(requests).toHaveLength(4))
    expect(requests[3]!.header).toEqual({ Authorization: 'Basic custom' })
    expect(getToken).toHaveBeenCalledTimes(3)
    respond(3)
    await publicRequest
  })

  it('默认不共享并发请求，也不缓存已完成的 GET', async () => {
    const client = createHttpClient({ baseURL: '' })
    const first = client.Get('/items').send()
    const second = client.Get('/items').send()
    await vi.waitFor(() => expect(requests).toHaveLength(2))
    respond(0, { code: 0, message: 'ok', data: 1 })
    respond(1, { code: 0, message: 'ok', data: 2 })
    await expect(Promise.all([first, second])).resolves.toEqual([1, 2])

    const third = client.Get('/items').send()
    await vi.waitFor(() => expect(requests).toHaveLength(3))
    respond(2, { code: 0, message: 'ok', data: 3 })
    await expect(third).resolves.toBe(3)
  })

  it('单次请求头覆盖公共头，空值省略，认证头仍由 Token 来源管理', async () => {
    const common = Object.freeze({
      'X-Tenant-ID': 'tenant-common',
      'Accept-Language': 'zh-CN',
      'X-Optional': 'common',
      'X-Unset': undefined,
      'authorization': 'common-token',
    })
    const client = createHttpClient({ baseURL: '', getHeaders: () => common, getToken: () => 'current-token' })
    const method = client.Get('/items', {
      headers: { 'x-tenant-id': 'tenant-specific', 'x-optional': null, 'Authorization': 'manual' },
    })
    const pending = method.send()
    await vi.waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]!.header).toEqual({
      'x-tenant-id': 'tenant-specific',
      'Accept-Language': 'zh-CN',
      'Authorization': 'Bearer current-token',
    })
    expect(method.config.headers).toEqual({ 'x-tenant-id': 'tenant-specific', 'x-optional': null, 'Authorization': 'manual' })
    expect(common.authorization).toBe('common-token')
    respond(0)
    await pending
  })

  it('公共头与 Token 开关独立，关闭两者后仍保留手写请求头', async () => {
    const getHeaders = vi.fn(() => ({ 'X-Tenant-ID': 'tenant-a' }))
    const getToken = vi.fn(() => 'current-token')
    const client = createHttpClient({ baseURL: '', getHeaders, getToken })
    for (const [index, meta] of [
      { commonHeaders: false },
      { auth: false },
      { commonHeaders: false, auth: false },
    ].entries()) {
      const pending = client.Get('/items', { meta, headers: { Authorization: 'Basic manual' } }).send()
      await vi.waitFor(() => expect(requests).toHaveLength(index + 1))
      expect(requests[index]!.header).toEqual([
        { Authorization: 'Bearer current-token' },
        { 'X-Tenant-ID': 'tenant-a', 'Authorization': 'Basic manual' },
        { Authorization: 'Basic manual' },
      ][index])
      respond(index)
      await pending
    }
    expect(getHeaders).toHaveBeenCalledTimes(1)
    expect(getToken).toHaveBeenCalledTimes(1)
  })

  it('切换租户后并发发送同一个 Method，各次传输保留发送时的请求头', async () => {
    let tenantId = 'tenant-a'
    const client = createHttpClient({ baseURL: '', getHeaders: () => ({ 'X-Tenant-ID': tenantId }) })
    const method = client.Get('/items')
    const first = method.send()
    await vi.waitFor(() => expect(requests).toHaveLength(1))
    tenantId = 'tenant-b'
    const second = method.send()
    await vi.waitFor(() => expect(requests).toHaveLength(2))
    expect(requests.map(options => options.header)).toEqual([{ 'X-Tenant-ID': 'tenant-a' }, { 'X-Tenant-ID': 'tenant-b' }])
    respond(1, { code: 0, message: 'ok', data: 'tenant-b' })
    respond(0, { code: 0, message: 'ok', data: 'tenant-a' })
    await expect(Promise.all([first, second])).resolves.toEqual(['tenant-a', 'tenant-b'])
  })

  it('公共头来源失败时拒绝请求，不发送缺失上下文的网络调用', async () => {
    const failure = new Error('无法读取租户状态')
    const client = createHttpClient({
      baseURL: '',
      getHeaders: () => {
        throw failure
      },
    })
    await expect(client.Get('/items').send()).rejects.toBe(failure)
    expect(request).not.toHaveBeenCalled()
  })

  it.each(['Session', ''])('客户端继承环境鉴权配置，支持前缀 %j 和自定义头的清理', async (prefix) => {
    vi.stubEnv('VITE_AUTH_HEADER_NAME', 'X-Session')
    vi.stubEnv('VITE_AUTH_TOKEN_PREFIX', prefix)
    vi.resetModules()
    const { createHttpClient: createConfiguredClient } = await import('./client')
    let token: string | undefined = 'current-token'
    const client = createConfiguredClient({ baseURL: '', getToken: () => token })
    const method = client.Get('/private', { headers: { 'x-session': 'stale', 'Authorization': 'Basic independent' } })

    const pending = method.send()
    await vi.waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]!.header).toEqual({
      'X-Session': prefix ? `${prefix} current-token` : 'current-token',
      'Authorization': 'Basic independent',
    })
    respond(0)
    await pending

    token = undefined
    const signedOut = method.send()
    await vi.waitFor(() => expect(requests).toHaveLength(2))
    expect(requests[1]!.header).toEqual({ Authorization: 'Basic independent' })
    respond(1)
    await signedOut

    const manual = client.Get('/public', { meta: { auth: false }, headers: { 'X-Session': 'manual' } }).send()
    await vi.waitFor(() => expect(requests).toHaveLength(3))
    expect(requests[2]!.header).toEqual({ 'X-Session': 'manual' })
    respond(2)
    await manual
  })

  it('实例鉴权配置可覆盖环境默认值，空前缀不会回退到 Bearer', async () => {
    const client = createHttpClient({
      baseURL: '',
      getToken: () => 'custom-token',
      authHeaderName: ' X-Token ',
      authTokenPrefix: '',
    })
    const pending = client.Get('/private').send()
    await vi.waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]!.header).toEqual({ 'X-Token': 'custom-token' })
    respond(0)
    await pending
  })

  it.each([
    ['request:fail timeout', 'timeout'],
    ['request:fail network disconnected', 'network'],
  ])('归一化底层错误 %s', async (errMsg, kind) => {
    const pending = createHttpClient({ baseURL: '' }).Get('/items').send()
    const assertion = expect(pending).rejects.toMatchObject({ name: 'RequestError', kind, message: errMsg })
    await vi.waitFor(() => expect(requests).toHaveLength(1))
    requests[0]!.fail?.({ errMsg })
    await assertion
  })

  it('调用 Method.abort 取消底层任务并拒绝为 abort 错误', async () => {
    const method = createHttpClient({ baseURL: '' }).Get('/items')
    const pending = method.send()
    const assertion = expect(pending).rejects.toMatchObject({ name: 'RequestError', kind: 'abort' })
    await vi.waitFor(() => expect(requests).toHaveLength(1))
    method.abort()
    await assertion
    await expect(pending).rejects.toBeInstanceOf(RequestError)
  })
})
