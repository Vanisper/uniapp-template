import { effectScope, onScopeDispose, watchEffect } from 'vue'

type Getter<T> = () => T | null | undefined

function createScopeDisposedError() {
  return new Error('等待 ref 就绪的作用域已销毁')
}

/**
 * 等待 getter 返回非 null/undefined 值
 *
 * @description
 * - getter 返回就绪值时 resolve
 * - getter 抛错时以原错误 reject
 * - 调用时存在活动作用域时，作用域销毁会停止等待并 reject
 *
 * @example
 * ```ts
 * const childRef = ref<InstanceType<typeof Child> | null>(null)
 *
 * onMounted(async () => {
 *   const child = await useRefReady(() => childRef.value)
 *   child.someMethod()
 * })
 * ```
 */
export function useRefReady<T>(getter: Getter<T>): Promise<T> {
  let immediate: T | null | undefined
  try {
    immediate = getter()
  }
  catch (error) {
    return Promise.reject(error)
  }

  // 快速路径：已经就绪则直接返回
  if (immediate != null) {
    return Promise.resolve(immediate)
  }

  return new Promise((resolve, reject) => {
    const waitScope = effectScope()
    let settled = false

    const settle = (callback: () => void) => {
      if (settled) {
        return
      }
      settled = true
      waitScope.stop()
      callback()
    }

    waitScope.run(() => {
      onScopeDispose(() => {
        if (settled) {
          return
        }
        settled = true
        reject(createScopeDisposedError())
      })

      watchEffect(() => {
        try {
          const value = getter()
          if (value != null) {
            settle(() => resolve(value))
          }
        }
        catch (error) {
          settle(() => reject(error))
        }
      })
    })
  })
}
