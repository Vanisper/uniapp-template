// -------------------------------------------
// 为了解决异步子组件 onShow 、 onLoad 生命周期于小程序端，首次访问时无法触发的问题
// 同时衍生了解决此问题的需求：uniapp 小程序端异步子组件首次访问时，父组件获取到的异步子组件 ref 实例为 null 的情况（需要切页面再回来 ref 才正常）
// -------------------------------------------
import type { MaybeRefOrGetter, WatchStopHandle } from 'vue'
import { shallowRef, toValue, watch } from 'vue'

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
