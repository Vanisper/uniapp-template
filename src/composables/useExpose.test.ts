import { describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useExposeReceiver } from './useExpose'

describe('useExposeReceiver', () => {
  it('ref 就绪后 getRef resolve', async () => {
    const scope = effectScope()
    const receiver = scope.run(() => useExposeReceiver<string>())!
    const pending = receiver.getRef()

    receiver.ref.value = 'ready'

    await expect(pending).resolves.toBe('ready')
    scope.stop()
  })

  it('从父作用域外调用 getRef 仍随父作用域销毁', async () => {
    const scope = effectScope()
    const receiver = scope.run(() => useExposeReceiver<string>())!
    const rejected = vi.fn()

    void receiver.getRef().catch(rejected)
    scope.stop()
    await Promise.resolve()

    expect(rejected).toHaveBeenCalledWith(expect.objectContaining({
      message: '等待 ref 就绪的作用域已销毁',
    }))
  })

  it('父作用域销毁后调用 getRef 立即 reject', async () => {
    const scope = effectScope()
    const receiver = scope.run(() => useExposeReceiver<string>())!
    const rejected = vi.fn()

    scope.stop()
    void receiver.getRef().catch(rejected)
    await Promise.resolve()

    expect(rejected).toHaveBeenCalledWith(expect.objectContaining({
      message: 'ExposeReceiver 所属作用域已销毁',
    }))
  })

  it('无活动作用域时禁止创建 receiver', () => {
    expect(() => useExposeReceiver<string>()).toThrow(
      'useExposeReceiver 必须在活动的 Vue effect scope 中调用',
    )
  })
})
