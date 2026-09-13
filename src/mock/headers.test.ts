import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHttpClient } from '@/http/client'
import { createMockAdapter } from './index'

const delay = 20
const request = vi.fn()

function createClient(getHeaders: () => Record<string, string | undefined>) {
  return createHttpClient({
    baseURL: 'https://api.example.test/v1',
    getHeaders,
    requestAdapter: createMockAdapter(delay, false),
  })
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
  vi.stubGlobal('uni', { request })
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('公共请求头 Mock 接口', () => {
  it('同一 Method 在切换租户和清除租户后回显最新值', async () => {
    const headers: Record<string, string | undefined> = { 'X-Tenant-ID': 'tenant-a' }
    const requestHeaders = { 'X-Client': 'demo' }
    const client = createClient(() => headers)
    const method = client.Get('/demo/headers', { headers: requestHeaders })

    await expect(receiveMock(method.send())).resolves.toEqual({ tenantId: 'tenant-a' })
    expect(headers).toEqual({ 'X-Tenant-ID': 'tenant-a' })
    headers['X-Tenant-ID'] = 'tenant-b'
    await expect(receiveMock(method.send())).resolves.toEqual({ tenantId: 'tenant-b' })
    expect(headers).toEqual({ 'X-Tenant-ID': 'tenant-b' })
    headers['X-Tenant-ID'] = undefined
    await expect(receiveMock(method.send())).resolves.toEqual({ tenantId: null })
    expect(headers).toEqual({ 'X-Tenant-ID': undefined })
    headers['X-Tenant-ID'] = 'tenant-c'
    await expect(receiveMock(method.send())).resolves.toEqual({ tenantId: 'tenant-c' })
    delete headers['X-Tenant-ID']
    await expect(receiveMock(method.send())).resolves.toEqual({ tenantId: null })
    expect(headers).toEqual({})
    expect(requestHeaders).toEqual({ 'X-Client': 'demo' })
    expect(method.config.headers).toEqual({ 'X-Client': 'demo' })
    expect(request).not.toHaveBeenCalled()
  })

  it('单次请求头忽略大小写覆盖公共头', async () => {
    const client = createClient(() => ({ 'X-Tenant-ID': 'tenant-common' }))
    const method = client.Get('/demo/headers', { headers: { 'x-tenant-id': 'tenant-specific' } })

    await expect(receiveMock(method.send())).resolves.toEqual({ tenantId: 'tenant-specific' })
    await expect(receiveMock(method.send())).resolves.toEqual({ tenantId: 'tenant-specific' })
    expect(request).not.toHaveBeenCalled()
  })

  it('跳过 Token 注入仍携带公共租户头', async () => {
    const client = createClient(() => ({ 'X-Tenant-ID': 'tenant-a' }))
    const method = client.Get('/demo/headers', { meta: { auth: false } })

    await expect(receiveMock(method.send())).resolves.toEqual({ tenantId: 'tenant-a' })
    expect(request).not.toHaveBeenCalled()
  })

  it('请求可跳过公共头，并保留显式提供的租户头', async () => {
    const getHeaders = vi.fn(() => ({ 'X-Tenant-ID': 'tenant-common' }))
    const client = createClient(getHeaders)
    const anonymous = client.Get('/demo/headers', { meta: { commonHeaders: false } })
    const explicit = client.Get('/demo/headers', {
      headers: { 'x-tenant-id': 'tenant-specific' },
      meta: { commonHeaders: false },
    })

    await expect(receiveMock(anonymous.send())).resolves.toEqual({ tenantId: null })
    await expect(receiveMock(explicit.send())).resolves.toEqual({ tenantId: 'tenant-specific' })
    expect(getHeaders).not.toHaveBeenCalled()
    expect(request).not.toHaveBeenCalled()
  })
})
