# ref 就绪等待生命周期设计

## 背景

`ExposeReceiver.getRef()` 用于等待异步子组件通过 `useExpose` 上报实例。当前实现会在每次调用时创建 `watchEffect`，但调用通常发生在 `onShow` 或点击事件中，监听不一定归创建 receiver 的父组件作用域管理。

这会产生三个问题：

- 父组件卸载后，尚未完成的等待任务没有明确的终止语义
- getter 在响应式重跑时抛错，只会成为 watcher 的未处理异常，返回的 Promise 不会 reject
- getter 在快速检查与 watcher 首次同步执行之间变为就绪时，可能在 `stop` 初始化前调用它

当前工作区还为 `useRefReady` 增加了多 getter 重载，但本次 `getRef` 功能没有该需求，也没有对应调用点和测试。

## 目标

- `getRef()` 从任意同步调用位置创建的等待任务都归 receiver 的父作用域管理
- getter 首次读取或后续重跑抛错时，返回的 Promise 都会 reject
- 父作用域销毁时，未完成的等待任务会停止监听并 reject
- 保留 ref 已就绪时立即 resolve 的快速路径
- `useExpose` 对 exposed 对象应用与 `defineExpose` 一致的顶层 ref 解包
- 公开类型和 JSDoc 能说明调用位置、完成条件与失败条件

## 非目标

- 不增加超时、重试或 `AbortSignal`
- 不支持同时等待多个 getter
- 不递归解包 exposed 对象中的嵌套 ref
- 不改变 `ref`、`shallowRef` 和 `reactive` 自身的响应式深度
- 不处理父作用域仍存活时业务永远不再提供 ref 的情况

## API 设计

`useRefReady` 保持单 getter API：

```ts
declare function useRefReady<T>(getter: () => T | null | undefined): Promise<T>
```

契约如下：

- getter 返回非 `null`、非 `undefined` 值时 resolve
- getter 抛错时以原错误 reject
- 调用时存在活动的 Vue effect scope 时，scope 销毁会停止监听并以 `Error` reject
- 调用时不存在 effect scope 时仍可等待，但调用方负责保证其生命周期

`ExposeReceiver<T>` 保留 `ref` 和 `getRef` 两个公开成员，`getRef` 的类型命名为 `RefReadyGetter<T>`：

```ts
export type RefReadyGetter<T> = () => Promise<T>
```

`useExposeReceiver` 必须在活动的 Vue effect scope 中创建。它捕获该 scope，之后调用 `getRef()` 时重新进入该 scope，再调用 `useRefReady`。因此，即使 `getRef()` 来自点击事件，内部监听仍会在父 scope 销毁时停止。receiver 创建位置不满足约束时同步抛错；父 scope 已销毁后调用 `getRef()` 时返回 rejected Promise。

`useExpose` 接收原始 exposed 对象，但 receiver 的值类型使用 `ShallowUnwrapRef<T>`。子组件上报时创建一次 `proxyRefs(markRaw(exposed))` 代理，后续 `getRef()` 返回同一个代理。顶层 ref 的读取和赋值分别转发到 `.value`，缓存代理也会持续读取最新值；普通变量仍是上报时的快照。

## 实现策略

`useRefReady` 继续使用 `watchEffect` 跟踪任意 getter 内部的响应式依赖，并增加统一的 settle/cleanup 流程：

- 快速路径读取包在 `try/catch` 中
- watcher 回调自身捕获 getter 异常并 reject
- 停止句柄允许在赋值前请求停止，赋值完成后补执行，避免同步首次执行的时序问题
- resolve、reject 和 scope dispose 共用幂等清理，保证只完成一次

`useExposeReceiver` 使用 `getCurrentScope()` 捕获父 scope，`getRef()` 使用 `scope.run()` 创建等待任务。页面中的循环示例会在 `<script setup>` 执行期间预先创建 receiver，避免从模板渲染期间延迟创建。

`useExpose` 把 `proxyRefs(markRaw(exposed))` 写入 receiver，并在卸载时使用代理身份判断是否仍应清空容器。浅解包代理不改变值本身的深度：`ref(object)` 保留深响应式，`shallowRef(object)` 只在替换 `.value` 时触发，普通嵌套对象中的 ref 保持为 ref。

## 测试

新增 Vitest 专项测试，覆盖：

- ref 已就绪时立即 resolve
- ref 延迟就绪时 resolve
- getter 首次读取抛错时 reject
- getter 在后续响应式重跑时抛错并 reject
- getter 第二次同步读取时就绪，不触发 `stop` 初始化错误
- `useRefReady` 所属 scope 销毁时 reject
- `getRef()` 从 scope 外调用，receiver 所属 scope 销毁时仍 reject
- receiver 所属 scope 销毁后调用 `getRef()` 时立即 reject
- receiver 在无活动 scope 时创建会抛错
- 缓存公开实例时，顶层 ref 更新仍能被读取和响应式追踪
- 同一子组件后续 `getRef()` 返回同一代理和最新值
- 顶层 `ref(object)` 与 `shallowRef(object)` 保持各自的响应式深度
- 普通嵌套对象中的 ref 不继续解包，普通变量保持上报时快照
- 旧子组件卸载不会误清后上报实例

## 验证

实现完成后执行专项测试、全量测试、类型检查、lint 和 H5 构建。lint 若仍受当前 Node 版本影响，需要记录环境错误，不能视为通过。
