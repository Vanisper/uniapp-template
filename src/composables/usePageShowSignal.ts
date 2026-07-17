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
