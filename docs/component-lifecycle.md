# 组件生命周期与接口就绪

异步组件的创建、页面显示和视图渲染是不同的时机。页面接入通过 `componentPlaceholder` 加载跨包组件，组件可以分别订阅页面显示、上报公开接口，并在需要时等待视图就绪。

## 选择工具

| 需求 | 工具 |
| --- | --- |
| 组件首次初始化并响应后续页面显示 | `useMixedOnShow` |
| 页面统一通知后代刷新 | `usePageShowProvider` / `useOnPageShow` |
| 父组件等待异步子组件的公开接口 | `useExposeReceiver` / `useExpose` |
| 等待响应式引用得到值 | `useRefReady` |

以下工具已纳入项目自动导入。生命周期订阅和 receiver 在组件 setup 中同步创建，页面参数由页面的 `onLoad(options)` 接收，再通过 props 传给子组件。

## 初始化与页面显示

组件自行管理刷新时使用 `useMixedOnShow`：

```ts
useMixedOnShow(() => {
  // 初始化或刷新状态
})

useMixedOnShow(() => {
  // 当前实例只初始化一次
}, { once: true })
```

首次执行取 `onShow` 和 `onBeforeMount` 中先到的一方。普通模式下，挂载前执行会跳过同一渲染周期内随后到来的一个 `onShow`，跳过窗口在 `nextTick` 关闭；之后的页面显示继续触发。`once: true` 在首次调用时标记完成。

首次回调提供初始化机会，可能发生在挂载前或页面已经隐藏后。它不代表页面当前可见，也不等待回调返回的 Promise。异步任务的错误、并发与取消由调用方处理。

## 页面向后代发送刷新信号

多个组件跟随同一页面刷新时，页面入口提供信号，后代订阅：

```ts
// 页面 setup
usePageShowProvider()
```

```ts
// 后代组件 setup
useOnPageShow(async () => {
  await refresh()
})
```

Provider 通过 `useMixedOnShow` 递增显示版本，并使用 provide/inject 共享。后代创建时若已有版本，会立即消费最新版本，随后跟随页面显示更新。每个页面入口调用一次 Provider；嵌套后代的 Provider 会复用祖先信号。

信号消费遵循以下规则：

- 等待当前异步回调完成，再消费最新版本；等待期间的多个版本可合并
- `once: true` 在回调成功完成后停止监听
- 回调失败后不重试同一版本，后续版本仍可触发；异步错误由业务回调处理
- 返回的停止函数停止监听，已启动的异步流程仍由业务管理

信号表示刷新版本，不记录 `onHide` 或当前可见性，适合刷新最新状态。需要逐条处理的事件使用事件队列。

`useOnPageShow` 查找祖先 Provider；没有 Provider 时改用 `useMixedOnShow`，因此不串行等待异步回调，`once` 在首次调用时生效，返回的停止函数为空操作。需要串行消费语义时，在页面入口提供信号。

## 等待子组件公开接口

父组件创建 receiver，并将整个容器作为 prop 传给子组件。子组件在 setup 中通过 `useExpose` 上报公开 API：

```vue
<script setup lang="ts">
const props = defineProps<{
  expose?: ExposeReceiver<{ test: (message: string) => string }>
}>()

function test(message: string) {
  return message
}

const exposed = { test }
useExpose(props.expose, exposed)
defineExpose(exposed)
</script>

<template>
  <view>demo</view>
</template>
```

父页面通过 `getRef()` 等待接口：

```vue
<script setup lang="ts">
import Demo from '@/packages/demo/components/Demo.vue'

defineOptions({ componentPlaceholder: { Demo: 'view' } })

const receiver = useExposeReceiver<ComponentExposed<typeof Demo>>()

onShow(async () => {
  try {
    const demo = await receiver.getRef()
    demo.test('from parent')
  }
  catch (error) {
    console.error('获取子组件接口失败', error)
  }
})
</script>

<template>
  <Demo :expose="receiver" />
</template>
```

`ComponentExposed<typeof Demo>` 提取组件的公开接口类型。子组件将同一个对象交给 `useExpose` 和 `defineExpose`，保持主动上报与模板 ref 的接口一致。

receiver 的使用约定：

- 在 setup 的活动作用域中创建；没有活动作用域时会抛错
- 通过 `:expose="receiver"` 传递整个容器，保留内部 ref
- 同时存在的多个实例使用各自的 receiver，列表按稳定业务 ID 关联
- `getRef()` 可在生命周期或事件中调用，等待任务归创建 receiver 的作用域管理
- 父作用域销毁时，未完成的等待及后续调用都会 reject
- 子组件卸载时清空自己的上报结果；重新创建后再次调用 `getRef()` 获取新接口

返回的 API 代理解包顶层 ref，缓存代理仍能读取这些 ref 的最新值。深层响应式行为由原对象使用的 `ref`、`shallowRef` 或 `reactive` 决定。

完整的单实例和列表用法见 [异步组件示例页](../src/pages/tests/refs.vue) 与 [Demo 组件](../src/packages/demo/components/Demo.vue)。

## 接口与视图的就绪时机

`useExpose` 在 setup 中上报，`getRef()` 完成表示公开接口可调用。需要节点测量或视图操作的方法，由子组件根据挂载、布局计算和目标平台渲染时机安排执行。

父组件的 `onMounted` 只等待同步子组件，异步子组件单独管理自己的就绪条件。参见 [Vue onMounted](https://vuejs.org/api/composition-api-lifecycle.html#onmounted) 与 [uni-app 页面生命周期](https://uniapp.dcloud.net.cn/tutorial/page.html#页面生命周期)。

## 通用引用等待

`useRefReady(() => value.value)` 等待 getter 返回非 `null`、非 `undefined` 的值。已有值时立即完成，否则跟踪响应式依赖；getter 抛错时以原错误 reject。

它适用于会由框架或业务正常赋值的引用。等待任务随调用时的活动作用域销毁而 reject，没有超时机制；无活动作用域时不会自动绑定组件销毁。事件回调需要等待异步子组件接口时，使用 setup 中创建的 receiver 管理等待归属。

实现见 [页面显示工具](../src/composables/usePageShowSignal/index.ts)、[公开接口容器](../src/composables/useExpose/index.ts) 和 [引用等待](../src/composables/useRefReady/index.ts)。
