import type { VueWrapper } from '@vue/test-utils'
import type { ShallowUnwrapRef } from 'vue'
import type { ExposeReceiver } from './useExpose'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  defineComponent,
  effectScope,
  h,
  isRef,
  nextTick,
  ref,
  shallowRef,
  watchEffect,
} from 'vue'
import { useExpose, useExposeReceiver } from './useExpose'

const wrappers: VueWrapper[] = []

afterEach(() => {
  for (const wrapper of wrappers)
    wrapper.unmount()
  wrappers.length = 0
})

function mountExposeHost<T extends object>(createExposed: () => T) {
  let receiver!: ExposeReceiver<ShallowUnwrapRef<T>>

  const Child = defineComponent({
    setup() {
      useExpose(receiver, createExposed())
      return () => null
    },
  })

  const Host = defineComponent({
    setup() {
      receiver = useExposeReceiver<ShallowUnwrapRef<T>>()
      return () => h(Child)
    },
  })

  const wrapper = mount(Host)
  wrappers.push(wrapper)

  return receiver
}

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

describe('useExpose', () => {
  it('缓存实例会持续读取顶层 ref 的最新值', async () => {
    const count = ref(0)
    const receiver = mountExposeHost(() => ({ count }))
    const cached = await receiver.getRef()
    let observed = -1
    const stop = watchEffect(() => {
      observed = cached.count
    })

    count.value = 1
    await nextTick()

    expect(cached.count).toBe(1)
    expect(observed).toBe(1)
    stop()
  })

  it('同一子组件后续 getRef 返回同一代理和最新值', async () => {
    const count = ref(0)
    const receiver = mountExposeHost(() => ({ count }))
    const first = await receiver.getRef()

    count.value = 1
    const second = await receiver.getRef()

    expect(second).toBe(first)
    expect(second.count).toBe(1)
    expect(second.count).toBe(first.count)
  })

  it('通过公开实例赋值会更新顶层 ref', async () => {
    const count = ref(0)
    const receiver = mountExposeHost(() => ({ count }))
    const exposed = await receiver.getRef()

    exposed.count = 1

    expect(count.value).toBe(1)
  })

  it('顶层 ref 对象保留深响应式', async () => {
    const state = ref({ count: 0 })
    const receiver = mountExposeHost(() => ({ state }))
    const exposed = await receiver.getRef()
    let observed = -1
    const stop = watchEffect(() => {
      observed = exposed.state.count
    })

    state.value.count = 1
    await nextTick()

    expect(observed).toBe(1)
    stop()
  })

  it('顶层 shallowRef 只在替换 value 时触发更新', async () => {
    const state = shallowRef({ count: 0 })
    const receiver = mountExposeHost(() => ({ state }))
    const exposed = await receiver.getRef()
    let observed = -1
    let runs = 0
    const stop = watchEffect(() => {
      runs += 1
      observed = exposed.state.count
    })

    state.value.count = 1
    await nextTick()

    expect(exposed.state.count).toBe(1)
    expect(observed).toBe(0)
    expect(runs).toBe(1)

    state.value = { count: 2 }
    await nextTick()

    expect(observed).toBe(2)
    expect(runs).toBe(2)
    stop()
  })

  it('普通嵌套对象中的 ref 不会继续解包', async () => {
    const count = ref(0)
    const receiver = mountExposeHost(() => ({
      state: { count },
    }))
    const exposed = await receiver.getRef()

    count.value = 1

    expect(isRef(exposed.state.count)).toBe(true)
    expect(exposed.state.count.value).toBe(1)
  })

  it('普通变量保留上报时快照，函数读取当前值', async () => {
    let count = 0
    const receiver = mountExposeHost(() => ({
      count,
      getCount: () => count,
    }))
    const exposed = await receiver.getRef()

    count = 1

    expect(exposed.count).toBe(0)
    expect(exposed.getCount()).toBe(1)
  })

  it('旧子组件卸载不会清空后上报的实例', async () => {
    let receiver!: ExposeReceiver<{ id: string }>
    const showFirst = ref(true)
    const first = { id: 'first' }
    const second = { id: 'second' }

    const FirstChild = defineComponent({
      setup() {
        useExpose(receiver, first)
        return () => null
      },
    })
    const SecondChild = defineComponent({
      setup() {
        useExpose(receiver, second)
        return () => null
      },
    })
    const Host = defineComponent({
      setup() {
        receiver = useExposeReceiver<{ id: string }>()
        return () => h('div', [
          showFirst.value ? h(FirstChild) : null,
          h(SecondChild),
        ])
      },
    })
    const wrapper = mount(Host)
    wrappers.push(wrapper)
    const current = await receiver.getRef()

    showFirst.value = false
    await nextTick()

    expect(receiver.ref.value).toBe(current)

    wrapper.unmount()

    expect(receiver.ref.value).toBeNull()
  })
})
