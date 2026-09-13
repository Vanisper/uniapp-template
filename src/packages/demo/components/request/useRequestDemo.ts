import type { RequestDemoScenario } from '../../api/request'
import { useRequest } from 'alova/client'
import { computed, onMounted, onScopeDispose, shallowRef } from 'vue'
import { RequestError } from '@/http/error'
import { getRequestDemo } from '../../api/request'

/** 管理示例列表的场景切换、重试与取消 */
export function useRequestDemo(enabled: boolean) {
  const scenario = shallowRef<RequestDemoScenario>('success')
  const { data, loading, error, send, abort } = useRequest(getRequestDemo, {
    immediate: false,
    force: true,
    initialData: { message: '', items: [] },
  })
  let pending = false
  const cancelled = computed(() => error.value instanceof RequestError && error.value.kind === 'abort')

  const errorMessage = computed(() => {
    if (!error.value)
      return ''

    if (error.value instanceof RequestError && error.value.kind === 'business' && error.value.code !== undefined)
      return `${error.value.message}（业务码 ${error.value.code}）`

    return error.value.message
  })

  async function load(nextScenario: RequestDemoScenario = scenario.value) {
    if (!enabled || pending)
      return

    pending = true
    scenario.value = nextScenario
    error.value = undefined
    try {
      await send(nextScenario)
    }
    catch {
      // 失败状态由 useRequest 的 error 统一呈现
    }
    finally {
      pending = false
    }
  }

  async function cancel() {
    if (!loading.value)
      return

    await abort()
  }

  onMounted(() => {
    void load()
  })
  onScopeDispose(() => {
    if (pending)
      void abort()
  })

  return { scenario, cancelled, data, loading, errorMessage, load, cancel }
}
