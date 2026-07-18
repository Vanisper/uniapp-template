import { watchEffect } from 'vue'

/**
 * 等待 ref 就绪（非 null/undefined）
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
export function useRefReady<T>(getter: () => T | null | undefined): Promise<T> {
  // 快速路径：已经就绪则直接返回
  const immediate = getter()
  if (immediate != null) {
    return Promise.resolve(immediate)
  }

  // 慢路径：等待 ref 变为非空
  return new Promise((resolve) => {
    const stop = watchEffect(() => {
      const val = getter()
      if (val != null) {
        stop() // ← 因为有上面的快速路径检查，
        // 这里执行时 val 一定是从 null 变为非 null
        // 也就是说至少是第二次执行，stop 已经赋值了
        resolve(val)
      }
    })
  })
}
