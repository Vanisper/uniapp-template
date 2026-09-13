import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPagingSource, pagingArticles, pagingDelay, pagingPageSize } from './data'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('分页示例数据源', () => {
  it('按服务端分页语义返回不重叠的数据，末页不足一页且结束后返回空数组', async () => {
    const source = createPagingSource()
    const pages = []
    for (let pageNo = 1; pageNo <= 5; pageNo++) {
      const request = source.request({ pageNo, pageSize: pagingPageSize })
      await vi.advanceTimersByTimeAsync(pagingDelay)
      pages.push(await request.promise)
    }

    expect(pages.map(page => page.length)).toEqual([6, 6, 6, 5, 0])
    expect(pages.flat()).toEqual(pagingArticles)
    expect(new Set(pages.flat().map(article => article.id)).size).toBe(23)
  })

  it('先组合关键词与分类，再分页；不存在的关键词返回空结果', async () => {
    const source = createPagingSource()
    const requests = [
      source.request({ pageNo: 1, pageSize: 6, keyword: ' 周末 ', category: '生活' }),
      source.request({ pageNo: 1, pageSize: 6, keyword: '不存在的内容' }),
      source.request({ pageNo: 2, pageSize: 6, category: '城市' }),
    ]
    await vi.advanceTimersByTimeAsync(pagingDelay)
    const [weekend, empty, secondPage] = await Promise.all(requests.map(request => request.promise))

    expect(weekend?.map(article => article.title)).toEqual(['给周末留一点空白'])
    expect(empty).toEqual([])
    expect(secondPage?.map(article => article.title)).toEqual(['逛一逛周末市集', '落日前再走一条街'])
  })

  it.each([
    ['first-error', 1],
    ['more-error', 2],
  ] as const)('%s 只在目标页失败一次，重试同页恢复原来的数据', async (scenario, pageNo) => {
    const source = createPagingSource(scenario)
    const first = source.request({ pageNo, pageSize: 6 })
    const rejected = expect(first.promise).rejects.toThrow('模拟加载失败')
    await vi.advanceTimersByTimeAsync(pagingDelay)
    await rejected

    const retry = source.request({ pageNo, pageSize: 6 })
    await vi.advanceTimersByTimeAsync(pagingDelay)
    expect(await retry.promise).toEqual(pagingArticles.slice((pageNo - 1) * 6, pageNo * 6))
  })

  it('取消请求会清理计时器，也不会消耗失败场景', async () => {
    const source = createPagingSource('first-error')
    const first = source.request({ pageNo: 1, pageSize: 6 })
    const canceled = expect(first.promise).rejects.toThrow('已取消')
    first.cancel()
    await canceled
    expect(vi.getTimerCount()).toBe(0)

    const next = source.request({ pageNo: 1, pageSize: 6 })
    const rejected = expect(next.promise).rejects.toThrow('模拟加载失败')
    await vi.advanceTimersByTimeAsync(pagingDelay)
    await rejected
  })
})
