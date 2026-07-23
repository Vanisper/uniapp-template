import type { ShallowRef } from 'vue'
import { onUnmounted, shallowRef } from 'vue'

/**
 * expose 容器
 *
 * @description 包一层普通对象，避免作为 prop 传递时被模板顶层 ref 自动解包
 */
export interface ExposeReceiver<T> {
  ref: ShallowRef<T | null>
  getRef: GetPromise<T>
}

/**
 * 父组件调用：为某个子组件实例创建专属的 expose 容器，通过 prop 传给子组件
 *
 * 替代模板 ref（小程序端异步子组件首次挂载时模板 ref 不赋值，
 * 切页面再回来才正常，被动等待拿不到实例，需要子组件主动上报）
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const receiver = useExposeReceiver<ComponentExposed<typeof Demo>>()
 *
 * onShow(async () => {
 *   const demo = await useRefReady(() => receiver.ref.value)
 *   demo.test('from parent')
 * })
 * </script>
 *
 * <template>
 *   <Demo :expose="receiver" />
 * </template>
 * ```
 */
export function useExposeReceiver<T>(): ExposeReceiver<T> {
  const ref = shallowRef<T | null>(null)
  return {
    ref,
    getRef: async () => await useRefReady<T>(() => ref.value),
  }
}

/**
 * 子组件调用：把自己的 API 主动写入父组件传入的容器
 *
 * setup 内同步执行，异步子组件首次挂载也可靠；
 * 与 defineExpose 使用同一个对象，保证运行时与类型一致
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const props = defineProps<{
 *   expose?: ExposeReceiver<any>
 * }>()
 *
 * const exposed = { test }
 * useExpose(props.expose, exposed)
 * defineExpose(exposed)
 * </script>
 * ```
 */
export function useExpose<T>(receiver: ExposeReceiver<T> | null | undefined, exposed: T) {
  if (!receiver)
    return

  receiver.ref.value = exposed

  onUnmounted(() => {
    // 防止实例泄漏；仅当容器还指向自己时才清空
    if (receiver.ref.value === exposed)
      receiver.ref.value = null
  })
}

/**
 * 从组件类型中提取 defineExpose 的类型
 * 实现取自 vue-component-type-helpers 的 ComponentExposed
 */
export type ComponentExposed<T>
  = T extends new (...args: any) => infer E ? E
    : T extends (props: any, ctx: any, expose: (exposed: infer E) => any, ...args: any) => any
      ? NonNullable<E>
      : object

export type GetPromise<T> = () => Promise<T>
