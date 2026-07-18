// -------------------------------------------
// 为了解决异步子组件 onShow 、 onLoad 生命周期于小程序端，首次访问时无法触发的问题
// 同时衍生了解决此问题的需求：uniapp 小程序端异步子组件首次访问时，父组件获取到的异步子组件 ref 实例为 null 的情况（需要切页面再回来 ref 才正常）
// -------------------------------------------
import type { InjectionKey, MaybeRefOrGetter, ShallowRef, WatchStopHandle } from 'vue'
import { inject, provide, shallowRef, toValue, watch } from 'vue'

export type PageShowSignal = number | undefined
export type PageShowHook = (handler: () => void) => void
export type PageShowSignalHandler = () => Promise<void> | void

export function usePageShowSignal(onPageShow: PageShowHook) {
  const pageShowSignal = shallowRef<PageShowSignal>()

  onPageShow(() => {
    pageShowSignal.value = (pageShowSignal.value ?? 0) + 1
  })

  return {
    pageShowSignal,
  }
}

export interface PageShowSignalEffectOptions {
  /**
   * handler 实际执行一次后停止
   */
  once?: true
}

export function usePageShowSignalEffect(
  pageShowSignal: MaybeRefOrGetter<PageShowSignal>,
  handler: PageShowSignalHandler,
  options: PageShowSignalEffectOptions = {},
) {
  const { once } = options

  let flushing = false
  let stopped = false
  let handledSignal: PageShowSignal

  let stop!: WatchStopHandle

  async function flushPageShowSignal() {
    if (flushing || stopped) {
      return
    }

    flushing = true
    try {
      while (!stopped) {
        const signal = toValue(pageShowSignal)
        if (signal === undefined || signal === handledSignal) {
          break
        }

        // 表示这个版本已经开始消费
        handledSignal = signal
        await handler()

        if (once) {
          stopped = true
          stop()
          break
        }
      }
    }
    finally {
      flushing = false
    }
  }

  stop = watch(
    () => toValue(pageShowSignal),
    () => void flushPageShowSignal(),
    { immediate: true },
  )

  return stop
}

// -------------------------------------------
const PAGE_SHOW_SIGNAL_KEY: InjectionKey<ShallowRef<PageShowSignal>> = Symbol('pageShowSignal')

/**
 * 混合实现的 onShow Hook（兼容异步组件）
 *
 * - 不依赖生命周期触发顺序
 * - 首次只执行一次（onShow 或 onBeforeMount，谁先触发谁执行）
 * - once: false 时，后续每次 onShow 都执行
 * - 只用两个生命周期 hook，无需其他
 *
 * @link https://uniapp.dcloud.net.cn/tutorial/page.html#vue3-lifecycle-flow
 */
export function useMixedOnShow(handler: () => void, options?: { once?: boolean }) {
  const { once = false } = options ?? {}

  let executed = false
  const runOnce = () => {
    if (executed)
      return
    executed = true
    handler()
  }

  if (once) {
    // once：两个 hook 互斥，只有先到者执行
    onShow(runOnce)
    onBeforeMount(runOnce)
    return
  }

  // 非 once：onShow 每次都执行（顺带标记首次已完成）
  onShow(() => {
    executed = true
    handler()
  })
  // onBeforeMount 仅作首次保底
  onBeforeMount(runOnce)
}

/**
 * @description 在 page setup 中调用，将 pageShowSignal 广播给所有后代
 */
export function usePageShowProvider() {
  const existingSignal = inject(PAGE_SHOW_SIGNAL_KEY, null)
  if (existingSignal) {
    return existingSignal // ! 复用父级，防止嵌套组件调用 Provider 的情况
  }

  const { pageShowSignal } = usePageShowSignal(useMixedOnShow)
  provide(PAGE_SHOW_SIGNAL_KEY, pageShowSignal)
  return pageShowSignal
}

/**
 * @description
 * - 在任意后代组件（含异步子组件）中调用，替代 onShow
 * - 小程序端通过 inject signal 消费
 * - 无 Provider 场景新增 once 参数支持，兜底为 onBeforeMount
 */
export function useOnPageShow(
  handler: PageShowSignalHandler,
  options?: PageShowSignalEffectOptions,
) {
  const signal = inject(PAGE_SHOW_SIGNAL_KEY, null)
  if (signal) {
    return usePageShowSignalEffect(signal, handler, options)
  }
  // 无 Provider: 降级到原生生命周期（异步组件首次可能不触发）
  try {
    const { once } = options ?? {}
    useMixedOnShow(handler, { once: !!once })
  }
  catch { /* noop */ }

  return () => {}
}
