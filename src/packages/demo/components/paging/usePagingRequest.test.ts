import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { pagingArticles, pagingDelay } from './data'
import { usePagingRequest } from './usePagingRequest'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('分页请求生命周期', () => {
  it('新筛选替换在途请求，只有最新结果交给分页组件', async () => {
    const scope = effectScope()
    const complete = vi.fn()
    let keyword = '周末'
    const paging = scope.run(() => usePagingRequest({ filters: () => ({ keyword }), complete }))!

    const first = paging.query(1, 6)
    await vi.advanceTimersByTimeAsync(200)
    keyword = '窗台'
    const second = paging.query(1, 6)
    await vi.advanceTimersByTimeAsync(pagingDelay)
    await Promise.all([first, second])

    expect(complete).toHaveBeenCalledOnce()
    expect(complete.mock.calls[0]?.[0].map((article: { title: string }) => article.title)).toEqual(['收集生活里的绿色', '给窗台添一盆植物'])
    expect(paging.loading.value).toBe(false)
    scope.stop()
  })

  it('加载失败用 complete(false) 结束；同一页重试成功，不丢失页码', async () => {
    const scope = effectScope()
    const complete = vi.fn(list => list === false ? Promise.reject(new Error('分页失败')) : Promise.resolve())
    const paging = scope.run(() => usePagingRequest({ scenario: 'more-error', filters: () => ({}), complete }))!

    const failed = paging.query(2, 6)
    await vi.advanceTimersByTimeAsync(pagingDelay)
    await failed
    expect(complete).toHaveBeenLastCalledWith(false)
    expect(paging.failed.value).toBe(true)
    expect(paging.loading.value).toBe(false)

    const retry = paging.query(2, 6)
    await vi.advanceTimersByTimeAsync(pagingDelay)
    await retry
    expect(complete).toHaveBeenLastCalledWith(pagingArticles.slice(6, 12))
    expect(paging.failed.value).toBe(false)
    expect(paging.requestedPage.value).toBe(2)
    scope.stop()
  })

  it('卸载清理在途请求，此后不再更新分页组件或创建请求', async () => {
    const scope = effectScope()
    const complete = vi.fn()
    const paging = scope.run(() => usePagingRequest({ filters: () => ({}), complete }))!
    const pending = paging.query(1, 6)
    scope.stop()
    await pending
    await paging.query(2, 6)
    await vi.advanceTimersByTimeAsync(pagingDelay)

    expect(complete).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
