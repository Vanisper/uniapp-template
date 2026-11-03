# 请求层与 Mock

项目使用 [alova v3](https://alova.js.org/zh-CN/tutorial/getting-started/introduce/)、[官方 uni-app 适配器](https://alova.js.org/zh-CN/resource/request-adapter/uniapp/) 和 [`@alova/mock`](https://alova.js.org/zh-CN/resource/request-adapter/alova-mock/)。H5、小程序和 App 共用请求入口，普通请求、上传与下载分别通过 `uni.request`、`uni.uploadFile` 和 `uni.downloadFile` 发送。

## 目录与默认行为

| 位置 | 职责 |
| --- | --- |
| `src/config/env.ts` | 解析 API 地址、超时、鉴权格式、Mock 开关与延迟 |
| `src/auth/token.ts` | 按环境配置的 key 读取、保存与清除 Token |
| `src/http/index.ts` | 提供公共 `http` 客户端和当前 `isMockEnabled` |
| `src/http/client.ts` | 创建独立客户端，配置传输、认证与全局响应处理 |
| `src/http/response.ts` | 检查 HTTP 状态、解包业务响应、处理上传与下载 |
| `src/http/error.ts` | 提供统一 `RequestError` 和错误分类 |
| `src/mock/index.ts` | 创建 Mock 适配器并配置真实请求回退 |
| `src/mock/demo.ts` | 请求示例的 Mock 分组 |
| `src/mock/auth.ts` | Mock 登录、受保护接口与匿名接口 |
| `src/mock/headers.ts` | 回显请求头中的标记值，用于验证公共头注入 |
| `src/mock/logger.ts` | Mock／真实请求标记及日志脱敏 |
| `src/packages/demo/api/request.ts` | GET 场景与 POST 回显接口 |
| `src/packages/demo/api/auth.ts` | 登录、个人信息与匿名接口 |

默认请求超时为 10 秒，关闭响应缓存和相同请求共享，错误交给调用方展示。Method 保留 alova 的配置能力，可按接口显式启用缓存或其他策略。

## 接口返回 Method

按业务域维护接口函数，返回 `http.Get()`、`http.Post()` 等创建的 Method。创建 Method 不会立即发送请求；`await`、`.send()` 和 `useRequest()` 按各自调用时机触发请求。泛型声明的是响应处理后的数据类型。

```ts
import { http } from '@/http'

interface RequestDemo {
  message: string
  items: { id: number, title: string }[]
}

export function getRequestDemo() {
  return http.Get<RequestDemo>('/demo/request')
}

export function postRequestDemo(message: string) {
  return http.Post<{ message: string }>('/demo/request', { message })
}
```

普通逻辑可直接 `await getRequestDemo()`。页面和组件在 `<script setup lang="ts">` 顶层使用 `alova/client` 的 hooks，保留 loading、取消、错误和重试能力：

```ts
import { useRequest } from 'alova/client'
import { getRequestDemo } from '../api/request'

const { data, loading, error, send, abort } = useRequest(getRequestDemo, {
  immediate: false,
})

async function refresh() {
  try {
    await send()
  }
  catch {
    // 页面通过 error 状态展示失败，避免点击事件产生未处理的 Promise 拒绝
  }
}
```

需要重试时再次调用 `send()`，取消时调用 `abort()`。事件处理器主动调用 `send()` 后也应处理拒绝结果；仅订阅 hook 的 `onError` 不能替代调用处的 Promise 错误处理。不要把接口函数封装为只返回 Promise 的 `async` 函数，否则无法将原始 Method 交给 hooks。

## 响应协议与错误

默认接口协议为：

```ts
interface ApiResponse<T> {
  code: number | string
  message: string
  data: T
}
```

成功码默认是数字 `0`，使用严格相等判断；响应 `{ code: 0, message: 'ok', data: value }` 解包为 `value`。`null`、`false`、`0` 和空字符串都原样保留。`data`、`body` 模式下 HTTP 204 返回 `undefined`，`raw` 模式和下载请求保留完整响应。默认模式下，其他成功响应缺少 `data` 或不符合协议时抛出协议错误。

| `RequestError.kind` | 含义 |
| --- | --- |
| `http` | HTTP 状态码不在 200–299 之间 |
| `business` | 响应符合协议，但业务码不是成功码 |
| `protocol` | 默认解包模式下，响应 JSON 或业务协议无效 |
| `network` | 底层传输失败 |
| `timeout` | 底层错误消息表示请求超时 |
| `abort` | 底层错误消息表示取消请求 |

异常同时保留 `message`，以及可获得的 `status`、`code` 和 `cause`。底层 uni 适配器主要通过错误消息区分取消、超时与其他网络失败。默认客户端不会自动弹 Toast、跳登录页或重试，调用处按场景处理：

```ts
import { RequestError } from '@/http'

try {
  await getRequestDemo()
}
catch (error) {
  if (error instanceof RequestError && error.kind === 'abort')
    return
  uni.showToast({ title: error instanceof Error ? error.message : '请求失败', icon: 'none' })
}
```

HTTP、业务、协议及传输错误都会拒绝当前请求，由调用方统一处理。

## 认证与不同响应格式

公共 `http` 已绑定 `src/auth/token.ts` 的 `getToken`，按 `VITE_AUTH_TOKEN_KEY` 读取 uni 同步存储。登录成功后调用 `setToken(token)`，退出时调用 `clearToken()`。每次实际发送时都会读取最新值，重复发送同一个 Method 也会清理此前注入的认证头。

创建独立客户端时可显式注入相同的 `getToken`，或替换为自己的登录状态来源。所有实例默认使用 `appEnv.authHeaderName` 和 `appEnv.authTokenPrefix`，无需逐个传入环境配置。

```ts
import { getToken } from '@/auth/token'
import { appEnv } from '@/config/env'
import { createHttpClient } from '@/http'

const accountHttp = createHttpClient({
  baseURL: appEnv.apiBaseURL,
  timeout: appEnv.requestTimeout,
  successCode: 200,
  getToken,
})

accountHttp.Get('/public', { meta: { auth: false } })
```

默认鉴权格式为 `Authorization: Bearer <token>`。请求头名称和前缀会移除首尾空白；前缀非空时与 Token 之间自动加入一个空格，空字符串表示直接发送 Token。全局格式与缓存 key 由 `VITE_AUTH_HEADER_NAME`、`VITE_AUTH_TOKEN_PREFIX` 和 `VITE_AUTH_TOKEN_KEY` 配置；单个客户端也可覆盖：

```ts
const legacyHttp = createHttpClient({
  baseURL: 'https://legacy-api.example.com',
  authHeaderName: 'X-Session',
  authTokenPrefix: '',
  getToken,
})
```

注入 Token 前，仅清理名称与配置相同的旧请求头，比较时忽略大小写；其他请求头保持原样。`getToken` 返回空值时也会清理该目标头，避免退出登录后重复发送旧 Token。`auth: false` 跳过读取与清理，保留调用方主动设置的认证头。

`meta.auth` 只控制自动注入，登录状态和权限由业务及服务端判断。独立客户端通过 `getToken` 选择 Token 来源，默认使用真实 uni 适配器；需要模拟时，通过 `requestAdapter` 传入 Mock 适配器。

单个请求可通过 `meta.responseMode` 选择返回层级，三个模式均检查 HTTP 状态：

| 模式 | 返回值 |
| --- | --- |
| `data`，默认 | 校验业务协议并返回 `data` |
| `body` | 原始响应体，跳过业务码与协议检查；字符串不自动解析 |
| `raw` | 完整 uni 响应，保留响应头、状态码等信息 |

```ts
http.Get<string>('/version.txt', { meta: { responseMode: 'body' } })
http.Get<UniApp.RequestSuccessCallbackResult>('/status', { meta: { responseMode: 'raw' } })
```

上传与下载沿用官方适配器配置。上传的 `name`、`filePath`、`files`、`file` 放在请求体中，其余字段作为 `formData`；默认响应模式会解析上传返回的 JSON 字符串。下载检查 HTTP 状态后总是返回完整结果，可读取 `tempFilePath`：

```ts
http.Post<{ url: string }>('/files', {
  name: 'file',
  filePath: '/local/path/image.png',
}, { requestType: 'upload' })

http.Get<UniApp.DownloadSuccessData>('/files/report.pdf', { requestType: 'download' })
```

## 公共请求头

`createHttpClient` 的 `getHeaders()` 在每次请求前读取当前公共头，适合语言、客户端版本等随调用变化的配置。公共 `http` 默认未配置 getter，实际接入时在 `src/http/index.ts` 的客户端配置中加入自己的 getter。

```ts
import { getToken } from '@/auth/token'
import { appEnv } from '@/config/env'
import { createHttpClient } from '@/http'

let locale = 'zh-CN'
const clientHttp = createHttpClient({
  baseURL: appEnv.apiBaseURL,
  getToken,
  getHeaders: () => ({ 'Accept-Language': locale }),
})

locale = 'en-US'
await clientHttp.Get('/orders')
```

请求头按名称忽略大小写合并，顺序为公共头 → 单次 `headers` → Token 注入。普通同名头由单次配置覆盖；公共值为 `null` 或 `undefined` 时省略，单次同名空值也可屏蔽该公共头。`getToken` 仍按既有契约管理认证头，需要手写认证头时设置 `meta.auth: false`。

| 配置 | 行为 |
| --- | --- |
| 默认 | 注入公共头与 Token |
| `meta.auth: false` | 跳过 Token，仍发送公共头，适合登录等尚未持有 Token 的接口 |
| `meta.commonHeaders: false` | 跳过公共头，仍注入 Token |
| 两者均为 `false` | 跳过两种自动注入，保留手写 `headers` |

```ts
clientHttp.Get('/orders', { headers: { 'accept-language': 'en-US' } })
clientHttp.Post('/login', { username: 'demo' }, { meta: { auth: false } })
clientHttp.Get('/options', { meta: { commonHeaders: false } })
```

重复发送同一个 Method 会读取最新公共头，不修改原 Method 的配置或 getter 返回对象。getter 抛错时请求直接失败，不发送缺失上下文的网络调用。它读取的是请求拦截器执行时的状态；需要固定取值的操作，应在创建 Method 时显式传入请求头。

当前默认关闭缓存与请求共享。若显式开启，动态公共头不会自动进入 alova 的缓存标识；应在 Method 创建时把变化值放入显式 `headers` 或 `params`，值变化后重新创建 Method，并取消或隔离旧响应，避免旧结果覆盖当前内容。

## Mock 开关与扩展

`development`、`test` 模板默认开启 Mock；`production` mode 始终关闭，构建时剔除 Mock 数据和适配器。测试构建 `build:test` 保留启用的 Mock。

Mock 使用 `matchMode: 'methodurl'`，路径与 Method 中的 URL 对应，不包含 API 根地址。查询参数通过 `params` 配置传入，回调从 `query` 读取：

```ts
http.Get('/demo/request', { params: { scenario: 'empty' } })
```

现有 GET 示例支持成功、`empty`、`business-error`、`http-error`；POST 示例回显非空 `message`，空消息返回业务失败。取消和超时由适配器根据请求操作与配置处理。

### Mock 鉴权示例

鉴权示例仅在 Mock 开启时可用，下面是完整的调用顺序，界面事件中还应捕获失败结果：

```ts
import { clearToken, setToken } from '@/auth/token'
import { http } from '@/http'

const result = await http.Post<{ token: string }>('/demo/auth/login', {
  username: 'demo',
  password: 'demo123',
}, { meta: { auth: false } })
setToken(result.token)

await http.Get('/demo/auth/profile')
await http.Get('/demo/auth/public', { meta: { auth: false } })
clearToken()
```

未登录时请求个人信息会收到 HTTP 401；登录请求通过 `meta.auth: false` 跳过注入，Mock 校验实际请求头中的认证信息后返回 Token。Mock 使用固定的演示 Token，不读取客户端缓存判断登录态；清除 Token 只影响本地缓存，真实服务应使用自己的登录、过期与退出协议。

### Mock 请求日志

命中 Mock 的请求由适配器在本地返回，不会出现在浏览器 Network 面板中。默认通过控制台的 `[Mock]` 日志查看方法、地址、请求参数与返回数据；未匹配的请求输出 `[HTTP]` 转发提示，其网络结果通过平台的网络调试工具查看。

日志保留请求头与响应头的名称并隐藏全部头值，参数与响应正文中的密码、Token、Cookie 等常见敏感字段也会脱敏，不修改实际请求或响应。`VITE_MOCK_LOG_ENABLED=false` 可关闭这些日志；Mock 关闭时不安装此日志回调。

Mock 日志在回调完成后输出，真实请求在转发时输出提示；取消和超时结果通过调用方的错误状态处理。

### 新增 Mock 分组

新增 Mock 时，按业务域新增工厂函数，并在 `createMockAdapter` 中注册：

```ts
import { defineMock } from '@alova/mock'

export function createProfileMocks() {
  return defineMock({
    '/profile/{id}': ({ params }) => ({
      code: 0,
      message: 'ok',
      data: { id: params.id, name: '示例用户' },
    }),
  })
}
```

`defineMock` 的第二个参数设为 `false` 可以禁用分组，路径前加 `-` 可以禁用单个接口。禁用或未匹配的请求都会通过 `httpAdapter: uniappRequestAdapter` 请求真实服务，使用前配置 `VITE_API_BASE_URL`。自定义 HTTP 响应时同时提供 `status`、`statusText` 和 `body`，避免被当作普通业务数据。

Mock 返回结果由 `uniappMockResponse` 转换为 uni 格式。当前适配器不保留自定义响应头，也不模拟上传、下载进度。超时会拒绝请求，但 Mock 回调仍可能执行，因此回调应以生成数据为主，避免依赖取消来控制副作用。[适配器实现](https://github.com/alovajs/alova/blob/main/packages/adapter-uniapp/src/mockResponse.ts)
