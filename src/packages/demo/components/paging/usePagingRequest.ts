import type { PagingArticle, PagingQuery, PagingRequest, PagingScenario } from './data'
import { onScopeDispose, readonly, shallowRef } from 'vue'
import { createPagingSource } from './data'

interface PagingRequestOptions {
  scenario?: PagingScenario
  filters: () => Pick<PagingQuery, 'category' | 'keyword'>
  complete: (list: PagingArticle[] | false) => Promise<unknown> | void
}

/** 将当前请求结果交给 z-paging，替换请求与卸载均取消在途模拟请求 */
export function usePagingRequest(options: PagingRequestOptions) {
  const source = createPagingSource(options.scenario)
  const loading = shallowRef(false)
  const failed = shallowRef(false)
  const requestedPage = shallowRef(1)
  let currentRequest: PagingRequest | undefined
  let generation = 0
  let disposed = false

  async function query(pageNo: number, pageSize: number) {
    if (disposed)
      return

    const requestGeneration = ++generation
    currentRequest?.cancel()
    const request = source.request({ ...options.filters(), pageNo, pageSize })
    currentRequest = request
    loading.value = true
    failed.value = false
    requestedPage.value = pageNo

    let result: PagingArticle[] | false
    try {
      result = await request.promise
    }
    catch {
      result = false
    }

    if (disposed || requestGeneration !== generation)
      return

    failed.value = result === false
    try {
      // complete(false) 本身也会拒绝 Promise，失败状态由 z-paging 呈现
      await options.complete(result)
    }
    catch {}
    finally {
      if (!disposed && requestGeneration === generation) {
        loading.value = false
        currentRequest = undefined
      }
    }
  }

  onScopeDispose(() => {
    disposed = true
    generation++
    currentRequest?.cancel()
  })

  return {
    query,
    loading: readonly(loading),
    failed: readonly(failed),
    requestedPage: readonly(requestedPage),
  }
}
