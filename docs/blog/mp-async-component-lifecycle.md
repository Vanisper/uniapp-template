# 小程序异步组件的页面显示与接口就绪

在 uni-app 分包异步组件场景中，页面加载、子组件创建和视图渲染并不同时完成。项目通过 `componentPlaceholder` 引用跨包组件，配置方式见 [bundle-optimizer 文档](https://github.com/uni-ku/bundle-optimizer#-功能与支持)。

这类场景下，项目曾遇到异步子组件错过首次 `onShow`、`onLoad`，以及父组件模板 ref 在首次访问时持续为空的情况。这些是特定运行环境下的现象，不能据此推断所有小程序版本的生命周期表现。本文说明当前工具的用法与边界。

## 选择工具

| 需求 | 工具 | 触发依据 |
| --- | --- | --- |
| 子组件首次初始化，并响应后续页面显示 | `useMixedOnShow` | 组件挂载前补首次，后续接收 `onShow` |
| 页面统一通知后代刷新 | `usePageShowProvider` / `useOnPageShow` | 共享页面显示版本，后代消费最新版本 |
| 父组件等待异步子组件提供接口 | `useExposeReceiver` / `useExpose` | 子组件主动上报公开 API |
| 等待会被正常赋值的响应式引用 | `useRefReady` | getter 返回非空值 |

下面的示例沿用项目的自动导入配置。生命周期相关工具应在组件 `setup` 阶段同步注册。

## 响应首次初始化与页面显示

### 组件自行注册

`useMixedOnShow` 适合组件首次创建时需要执行一次、后续页面显示时继续执行的逻辑：

```ts
useMixedOnShow(() => {
  // 初始化或刷新组件状态
})

useMixedOnShow(() => {
  // 仅在当前组件实例中初始化一次
}, { once: true })
```

首次执行取 `onShow` 和 `onBeforeMount` 中先到的一方。普通模式下，若 `onBeforeMount` 先执行，会跳过随后到来的一个 `onShow`；这个跳过窗口在 `nextTick` 回调中关闭。窗口关闭后的 `onShow` 正常执行。`once: true` 则在首次调用时标记完成，两个 hook 合计只调用一次。

这个机制补充的是组件初始化机会。首次回调可能发生在挂载前，也可能发生在所属页面已经隐藏之后；它不保证页面此刻可见。首次去重也只覆盖上述窗口，不能承诺任意延迟的 `onShow` 都会与挂载回调合并。

`useMixedOnShow` 不等待回调返回的 Promise，因此不负责异步任务串行化、失败重试或卸载取消。异步回调需要自行处理错误与任务有效性。

> [!NOTE]
> `once: true` 表示当前组件实例仅调用一次，不等同于 `onLoad`。页面参数仍应由页面的 `onLoad(options)` 接收，再通过 props 等方式传给子组件；`onLoad` 与 `onShow` 的职责见 [uni-app 页面生命周期](https://uniapp.dcloud.net.cn/tutorial/page.html#页面生命周期)。

### 页面统一提供信号

多个后代需要跟随同一页面刷新时，在页面 `setup` 中调用一次 Provider：

```ts
// 页面
usePageShowProvider()
```

后代组件在自己的 `setup` 中订阅：

```ts
// 子组件
useOnPageShow(() => {
  // 根据页面显示信号刷新
})

useOnPageShow(() => {
  // 首次消费时初始化
}, { once: true })
```

Provider 内部使用 `useMixedOnShow` 推进显示版本，再通过 provide/inject 共享给后代。嵌套组件调用 Provider 时会复用祖先的信号；将 Provider 放在页面入口，可以明确每个页面的通知范围。同一组件内重复调用 Provider 不会复用自己提供的信号，`useOnPageShow` 也只查找祖先的 Provider。

子组件订阅时若已有显示版本，会立即消费一次，后续再响应版本变化。信号只记录显示版本，不记录 `onHide`，因此这次补消费也不代表页面仍然可见。

底层 `usePageShowSignal` 负责递增版本，`usePageShowSignalEffect` 负责消费。消费规则如下：

- 初始值 `undefined` 不触发回调
- 同一订阅内等待异步回调完成，再读取最新版本，避免并发重入
- 同一轮调度或异步执行期间的多个版本变化可能合并；例如版本从 1 连续变为 2、3，下一次只消费 3
- `once: true` 在回调正常返回或 Promise 成功完成后停止监听；失败不会自动重试同一版本，后续版本仍可能触发回调
- 返回的停止函数只停止监听，不取消已启动的异步消费流程；业务请求的取消与迟到结果处理由调用方负责

这是刷新最新状态的机制。需要逐条处理的事件应使用明确的事件队列，异步回调的错误也应在业务侧处理。

没有 Provider 时，`useOnPageShow` 使用 `useMixedOnShow`。这条路径沿用组件自行注册的行为：不串行等待异步回调，`once` 在首次调用时生效，返回的停止函数为空操作。需要信号消费语义时，应显式提供 Provider。

## 等待异步子组件的公开接口

### 父组件创建容器，子组件上报

`useExposeReceiver` 创建独立容器，父组件通过 prop 将整个容器交给子组件。子组件在 `setup` 中用 `useExpose` 写入公开 API，父组件通过 `getRef()` 等待该 API 可用。

子组件示例：

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

父组件示例：

```vue
<script setup lang="ts">
import Demo from '@/packages/demo/components/Demo.vue'

defineOptions({
  componentPlaceholder: {
    Demo: 'view',
  },
})

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

`ComponentExposed<typeof Demo>` 从组件类型提取公开接口。子组件将同一个对象交给 `useExpose` 和 `defineExpose`，使主动上报与模板 ref 的公开接口保持一致。

### 容器与作用域

- 在父组件 `setup` 的活动作用域中创建 receiver；没有活动作用域时，创建会抛错
- 通过 `:expose="receiver"` 传递整个容器，避免直接传顶层 ref 时被模板自动解包
- 同时存在的多个子组件各用一个 receiver；列表实例可按稳定的业务 id 关联容器
- `getRef()` 可在生命周期或事件回调中调用，等待任务始终归创建 receiver 的作用域管理
- 父作用域销毁时，尚未完成的等待会 reject；销毁后再调用也会 reject
- 子组件卸载时，仅在容器仍指向自己时清空，避免旧实例清除新实例的上报结果

`getRef()` 返回的是公开 API 代理。它解包顶层 ref，缓存该代理后仍能读取这些 ref 的最新值；深层响应式行为由原始的 `ref`、`shallowRef` 或 `reactive` 决定。子组件卸载重建后，需要重新调用 `getRef()` 获取新实例的 API。

完整的单实例与列表接入示例见 [首页](../../src/pages/index.vue) 和 [Demo 组件](../../src/packages/demo/components/Demo.vue)。

### 接口就绪与渲染就绪

`useExpose` 在 `setup` 中上报，`getRef()` 完成只表示子组件已经提供接口，不表示挂载、布局计算或小程序视图渲染已经完成。需要测量节点或操作视图的方法，应由子组件根据目标平台的渲染时机管理就绪条件。

父组件的 `onMounted` 也不能作为所有异步子组件已经挂载的保证；Vue 明确将异步子组件排除在父组件的同步挂载等待范围之外。参见 [Vue onMounted 文档](https://vuejs.org/api/composition-api-lifecycle.html#onmounted)。

## 通用的引用等待

`useRefReady(() => value.value)` 等待 getter 返回非 `null`、非 `undefined` 的值：已有值时立即完成，否则跟踪响应式依赖，直到值就绪。getter 抛错时会 reject。

它可以用于正常赋值的模板 ref，也是 receiver 内部的等待原语。它不负责促使框架赋值；若模板 ref 始终为空，仅增加等待时间不能建立缺失的上报链路。

直接调用 `useRefReady` 时，等待任务归调用当时的活动作用域管理；作用域销毁会结束等待并 reject。它没有超时机制，无活动作用域时也不会自动随某个组件卸载而结束。需要从事件回调中等待子组件接口时，使用已在 `setup` 创建的 receiver。

## 源码

- [页面显示工具](../../src/composables/usePageShowSignal/index.ts)
- [公开接口容器](../../src/composables/useExpose/index.ts) · [测试](../../src/composables/useExpose/index.test.ts)
- [引用等待](../../src/composables/useRefReady/index.ts) · [测试](../../src/composables/useRefReady/index.test.ts)
