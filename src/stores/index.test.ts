import { setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'

let disposeStore: (() => void) | undefined

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  disposeStore?.()
  disposeStore = undefined
  setActivePinia(undefined)
  vi.unstubAllGlobals()
})

async function setupCounter(initialValue?: string) {
  const storage = new Map<string, string>()
  if (initialValue !== undefined) {
    storage.set('counter', initialValue)
  }

  const getStorageSync = vi.fn((key: string) => storage.get(key) ?? '')
  const setStorageSync = vi.fn((key: string, value: string) => storage.set(key, value))
  vi.stubGlobal('uni', { getStorageSync, setStorageSync })

  const { setupPinia } = await import('./index')
  const { useCounterStore } = await import('./modules/counter')
  const pinia = setupPinia(createApp({}))
  const counter = useCounterStore(pinia)
  disposeStore = () => counter.$dispose()

  return { counter, storage, getStorageSync, setStorageSync }
}

describe('pinia 持久化接入', () => {
  it('从 uni 同步存储恢复状态，并在操作后写回 JSON', async () => {
    const { counter, storage, getStorageSync, setStorageSync } = await setupCounter('{"count":7}')

    expect(getStorageSync).toHaveBeenCalledWith('counter')
    expect(counter.count).toBe(7)

    counter.increment()
    await nextTick()

    expect(counter.count).toBe(8)
    expect(setStorageSync).toHaveBeenLastCalledWith('counter', '{"count":8}')
    expect(JSON.parse(storage.get('counter')!)).toEqual({ count: 8 })
  })

  it('缺少缓存时使用初始状态，并持久化值为零的状态', async () => {
    const { counter, storage } = await setupCounter()

    expect(counter.count).toBe(0)

    counter.increment()
    await nextTick()
    counter.decrement()
    await nextTick()

    expect(JSON.parse(storage.get('counter')!)).toEqual({ count: 0 })
  })

  it('缓存不是有效 JSON 时保留初始状态，并在修改后覆盖损坏的缓存', async () => {
    const { counter, storage } = await setupCounter('{"count":')

    expect(counter.count).toBe(0)

    counter.increment()
    await nextTick()

    expect(JSON.parse(storage.get('counter')!)).toEqual({ count: 1 })
  })
})
