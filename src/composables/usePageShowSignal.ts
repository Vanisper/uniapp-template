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
    () => {
      void flushPageShowSignal()
    },
    { immediate: true },
  )

  return stop
}

// -------------------------------------------
const PAGE_SHOW_SIGNAL_KEY: InjectionKey<ShallowRef<PageShowSignal>> = Symbol('pageShowSignal')

/**
 * @description 在 page setup 中调用，将 pageShowSignal 广播给所有后代
 */
export function usePageShowProvider() {
  const existingSignal = inject(PAGE_SHOW_SIGNAL_KEY, null)
  if (existingSignal)
    return existingSignal // ! 复用父级，防止嵌套组件调用 Provider 的情况

  if (import.meta.env.DEV) {
    console.warn('[usePageShowProvider] 创建根 signal，请确保在 Page/Layout 中调用')
  }
  // ! 此处依赖组件环节的 onShow 生命周期，故需要保证组件环节为非异步环节
  // ! onBeforeMount 也能满足部分需求，但是无法实现 onShow 的反复进入的效果
  // ? 后续可以尝试 onBeforeMount 与 onShow 配合实现效果，因为异步组件成功渲染完成之后，onShow 就正常了（一般切换页面再回来就可以了）
  const { pageShowSignal } = usePageShowSignal(onShow)
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
    if (once) {
      onBeforeMount(handler)
    }
    else {
      onShow(handler)
    }
  }
  catch { /* noop */ }
  return () => {}
}
