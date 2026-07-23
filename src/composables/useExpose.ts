import type { ShallowRef, ShallowUnwrapRef } from 'vue'
import {
  getCurrentScope,
  markRaw,
  onUnmounted,
  proxyRefs,
  shallowRef,
} from 'vue'
import { useRefReady } from './useRefReady'

/**
 * expose 容器
 *
 * @description 包一层普通对象，避免作为 prop 传递时被模板顶层 ref 自动解包
 */
export interface ExposeReceiver<T> {
  /** 子组件上报的当前实例 */
  ref: ShallowRef<T | null>
  /**
   * 等待当前实例就绪
   *
   * @description 父作用域销毁时返回 rejected Promise
   */
  getRef: RefReadyGetter<T>
}

/**
 * 父组件调用：为某个子组件实例创建专属的 expose 容器，通过 prop 传给子组件
 *
 * 替代模板 ref（小程序端异步子组件首次挂载时模板 ref 不赋值，
 * 切页面再回来才正常，被动等待拿不到实例，需要子组件主动上报）
 *
 * @description
 * - 必须在活动的 Vue effect scope 中调用
 * - getRef 可在生命周期或事件回调中调用，等待任务仍归创建时的作用域管理
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const receiver = useExposeReceiver<ComponentExposed<typeof Demo>>()
 *
 * onShow(async () => {
 *   const demo = await receiver.getRef()
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
  const ownerScope = getCurrentScope()
  if (!ownerScope) {
    throw new Error('useExposeReceiver 必须在活动的 Vue effect scope 中调用')
  }

  const ref = shallowRef<T | null>(null)
  return {
    ref,
    getRef: () => {
      if (!ownerScope.active) {
        return Promise.reject(new Error('ExposeReceiver 所属作用域已销毁'))
      }

      return ownerScope.run(() => useRefReady<T>(() => ref.value))
        ?? Promise.reject(new Error('ExposeReceiver 所属作用域已销毁'))
    },
  }
}

/**
 * 子组件调用：把自己的 API 主动写入父组件传入的容器
 *
 * @description
 * - setup 内同步执行，异步子组件首次挂载也可靠
 * - 与 defineExpose 一致，仅自动解包 exposed 对象的顶层 ref
 * - 深层响应式行为由原始的 ref、shallowRef 或 reactive 决定
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
export function useExpose<T extends object>(
  receiver: ExposeReceiver<ShallowUnwrapRef<T>> | null | undefined,
  exposed: T,
) {
  if (!receiver)
    return

  const exposedProxy = proxyRefs(markRaw(exposed))
  receiver.ref.value = exposedProxy

  onUnmounted(() => {
    // 防止实例泄漏；仅当容器还指向自己时才清空
    if (receiver.ref.value === exposedProxy)
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

/** 等待 ref 就绪的函数 */
export type RefReadyGetter<T> = () => Promise<T>
