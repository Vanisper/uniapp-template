import { effectScope, nextTick, shallowRef } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useRefReady } from './useRefReady'

describe('useRefReady', () => {
  it('立即返回已经就绪的值', async () => {
    await expect(useRefReady(() => 'ready')).resolves.toBe('ready')
  })

  it('等待响应式值就绪', async () => {
    const value = shallowRef<string | null>(null)
    const pending = useRefReady(() => value.value)

    value.value = 'ready'
    await nextTick()

    await expect(pending).resolves.toBe('ready')
  })

  it('getter 首次读取抛错时 reject', async () => {
    const error = new Error('首次读取失败')

    await expect(useRefReady(() => {
      throw error
    })).rejects.toBe(error)
  })

  it('getter 后续重跑抛错时 reject', async () => {
    const trigger = shallowRef(false)
    const error = new Error('后续读取失败')
    const rejected = vi.fn()
    const pending = useRefReady(() => {
      if (trigger.value) {
        throw error
      }
      return null
    })

    void pending.catch(rejected)
    trigger.value = true
    await nextTick()

    expect(rejected).toHaveBeenCalledWith(error)
  })

  it('getter 第二次同步读取就绪时正常停止', async () => {
    let calls = 0

    await expect(useRefReady(() => {
      calls += 1
      return calls === 1 ? null : 'ready'
    })).resolves.toBe('ready')
  })

  it('所属作用域销毁时 reject', async () => {
    const scope = effectScope()
    const rejected = vi.fn()
    const pending = scope.run(() => useRefReady(() => null))

    void pending?.catch(rejected)
    scope.stop()
    await Promise.resolve()

    expect(rejected).toHaveBeenCalledWith(expect.objectContaining({
      message: '等待 ref 就绪的作用域已销毁',
    }))
  })
})
