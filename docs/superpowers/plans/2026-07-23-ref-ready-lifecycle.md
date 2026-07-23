# Ref Ready Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 ref 就绪等待任务具备明确的异常和作用域销毁语义，并确保 `ExposeReceiver.getRef()` 始终归父组件作用域管理。

**Architecture:** `useRefReady` 为每次慢路径等待创建一个嵌套 effect scope，通过 scope 的停止统一清理 watcher，并在父 scope 销毁时 reject。`useExposeReceiver` 捕获创建时的父 scope，之后通过 `scope.run()` 创建等待任务，使事件回调中的 `getRef()` 仍挂到父 scope。`useExpose` 使用 Vue 的浅解包代理上报公开 API，使 receiver 与 `defineExpose` 的顶层 ref 行为一致。

**Tech Stack:** TypeScript 5.9、Vue 3.4 effect scope、Vitest 2.1、pnpm

## Global Constraints

- 不增加超时、重试或 `AbortSignal`
- `useRefReady` 只支持单 getter
- `useExpose` 只解包 exposed 对象的顶层 ref，不递归解包嵌套 ref
- 不改变 `ref`、`shallowRef` 和 `reactive` 自身的响应式深度
- 中文源码注释保持精炼，公开 API JSDoc 说明完成条件和失败条件
- 保留工作区中与本任务无关的用户改动

---

### Task 1: 收敛 `useRefReady` 的完成和失败语义

**Files:**
- Create: `src/composables/useRefReady.test.ts`
- Modify: `src/composables/useRefReady.ts`

**Interfaces:**
- Consumes: Vue `effectScope`、`onScopeDispose`、`watchEffect`
- Produces: `useRefReady<T>(getter: () => T | null | undefined): Promise<T>`

- [ ] **Step 1: 写入正常路径和异常路径测试**

```ts
import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useRefReady } from './useRefReady'

describe('useRefReady', () => {
  it('立即返回已经就绪的值', async () => {
    await expect(useRefReady(() => 'ready')).resolves.toBe('ready')
  })

  it('等待响应式值就绪', async () => {
    const value = ref<string | null>(null)
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
    const trigger = ref(false)
    const error = new Error('后续读取失败')
    const pending = useRefReady(() => {
      if (trigger.value) {
        throw error
      }
      return null
    })

    trigger.value = true
    await nextTick()

    await expect(pending).rejects.toBe(error)
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
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `pnpm vitest run src/composables/useRefReady.test.ts`

Expected: 后续 getter 异常测试超时或收到未处理 watcher 异常；同步二次读取测试收到 `ReferenceError`；scope 销毁测试的 reject spy 未调用。

- [ ] **Step 3: 写入最小实现**

```ts
import { effectScope, onScopeDispose, watchEffect } from 'vue'

type Getter<T> = () => T | null | undefined

function createScopeDisposedError() {
  return new Error('等待 ref 就绪的作用域已销毁')
}

/**
 * 等待 getter 返回非 null/undefined 值
 *
 * @description
 * - getter 返回就绪值时 resolve
 * - getter 抛错时以原错误 reject
 * - 调用时存在活动作用域时，作用域销毁会停止等待并 reject
 */
export function useRefReady<T>(getter: Getter<T>): Promise<T> {
  let immediate: T | null | undefined
  try {
    immediate = getter()
  }
  catch (error) {
    return Promise.reject(error)
  }

  if (immediate != null) {
    return Promise.resolve(immediate)
  }

  return new Promise((resolve, reject) => {
    const waitScope = effectScope()
    let settled = false

    const settle = (callback: () => void) => {
      if (settled) {
        return
      }
      settled = true
      waitScope.stop()
      callback()
    }

    waitScope.run(() => {
      onScopeDispose(() => {
        if (settled) {
          return
        }
        settled = true
        reject(createScopeDisposedError())
      })

      watchEffect(() => {
        try {
          const value = getter()
          if (value != null) {
            settle(() => resolve(value))
          }
        }
        catch (error) {
          settle(() => reject(error))
        }
      })
    })
  })
}
```

- [ ] **Step 4: 运行专项测试并确认 GREEN**

Run: `pnpm vitest run src/composables/useRefReady.test.ts`

Expected: 6 tests passed，且无 Vue watcher 未处理异常。

- [ ] **Step 5: 提交**

```bash
git add src/composables/useRefReady.ts src/composables/useRefReady.test.ts
git commit -m "fix(composables): 收敛 ref 就绪等待生命周期"
```

### Task 2: 将 `getRef()` 绑定到 receiver 父作用域

**Files:**
- Create: `src/composables/useExpose.test.ts`
- Modify: `src/composables/useExpose.ts`
- Modify: `src/pages/index.vue`
- Modify: `src/typings/auto-imports.d.ts`

**Interfaces:**
- Consumes: Task 1 的 `useRefReady<T>(getter): Promise<T>`
- Produces: `RefReadyGetter<T> = () => Promise<T>`、`ExposeReceiver<T>.getRef`

- [ ] **Step 1: 写入 receiver 作用域测试**

```ts
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
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `pnpm vitest run src/composables/useExpose.test.ts`

Expected: 父 scope 销毁测试的 reject spy 未调用；销毁后调用测试未 reject；无 scope 创建测试未抛错。

- [ ] **Step 3: 更新 receiver 类型、实现和 JSDoc**

```ts
import { getCurrentScope, onUnmounted, shallowRef } from 'vue'

export interface ExposeReceiver<T> {
  /** 子组件上报的当前实例 */
  ref: ShallowRef<T | null>
  /** 等待当前实例就绪 */
  getRef: RefReadyGetter<T>
}

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
      return ownerScope.run(() => useRefReady<T>(() => ref.value))!
    },
  }
}

/** 等待 ref 就绪的函数 */
export type RefReadyGetter<T> = () => Promise<T>
```

同时把 `useExposeReceiver` 的公开示例改为：

```ts
onShow(async () => {
  const demo = await receiver.getRef()
  demo.test('from parent')
})
```

- [ ] **Step 4: 在 setup 中预先创建循环 receiver 并更新类型名**

```ts
const receivers = new Map<string, ExposeReceiver<DemoCompExposed>>()
for (const item of items.value) {
  receivers.set(item.id, useExposeReceiver<DemoCompExposed>())
}

function receiverOf(id: string) {
  const receiver = receivers.get(id)
  if (!receiver) {
    throw new Error(`未找到 id 为 ${id} 的 expose 容器`)
  }
  return receiver
}

async function callItem(getRef: RefReadyGetter<DemoCompExposed>, msg = '') {
  const inst = await getRef()
  uni.showToast({ title: inst.test(msg) })
}
```

把 `src/typings/auto-imports.d.ts` 中的 `GetPromise` 改为 `RefReadyGetter`。

- [ ] **Step 5: 运行专项测试和类型检查并确认 GREEN**

Run: `pnpm vitest run src/composables/useExpose.test.ts src/composables/useRefReady.test.ts`

Expected: 10 tests passed。

Run: `pnpm type-check`

Expected: exit 0。

- [ ] **Step 6: 提交**

```bash
git add src/composables/useExpose.ts src/composables/useExpose.test.ts src/pages/index.vue src/typings/auto-imports.d.ts
git commit -m "fix(composables): 绑定 expose receiver 父作用域"
```

### Task 3: 更新文档并完成全量验证

**Files:**
- Modify: `docs/blog/mp-async-component-lifecycle.md`

**Interfaces:**
- Consumes: Task 2 的 `ExposeReceiver<T>.getRef`
- Produces: 与当前 API 一致的使用文档

- [ ] **Step 1: 更新博客中的调用示例和作用域约束**

将父组件示例改为：

```ts
const receiver = useExposeReceiver<ComponentExposed<typeof Demo>>()

onShow(async () => {
  const demo = await receiver.getRef()
  demo.test('from parent')
})
```

在容器设计说明中补充：

```markdown
`useExposeReceiver` 需要在父组件 setup 的活动作用域中创建；`getRef()` 可以在生命周期或事件回调中调用，内部等待仍归父组件作用域管理，父组件卸载时会停止并 reject。
```

- [ ] **Step 2: 运行完整验证**

Run: `pnpm test`

Expected: 全部测试通过。

Run: `pnpm type-check`

Expected: exit 0。

Run: `pnpm lint`

Expected: exit 0；若 Node 18 仍报 `Invalid regular expression flags`，记录为环境阻塞，不声明 lint 通过。

Run: `pnpm build`

Expected: exit 0；允许已有的 UnoCSS 图标加载警告。

Run: `git diff --check HEAD`

Expected: exit 0。

- [ ] **Step 3: 提交文档**

```bash
git add docs/blog/mp-async-component-lifecycle.md
git commit -m "docs(composables): 更新 expose receiver 用法"
```
