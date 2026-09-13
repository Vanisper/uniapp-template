# 请求层与 Mock

项目使用 [alova v3](https://alova.js.org/zh-CN/tutorial/getting-started/introduce/)、[官方 uni-app 适配器](https://alova.js.org/zh-CN/resource/request-adapter/uniapp/) 和 [`@alova/mock`](https://alova.js.org/zh-CN/resource/request-adapter/alova-mock/)。H5、小程序和 App 共用请求入口，普通请求、上传与下载分别通过 `uni.request`、`uni.uploadFile` 和 `uni.downloadFile` 发送。

## 目录与默认行为

| 位置 | 职责 |
| --- | --- |
| `src/config/env.ts` | 解析 API 地址、超时、鉴权格式、Mock 开关与延迟 |
| `src/http/index.ts` | 提供公共 `http` 客户端和当前 `isMockEnabled` |
| `src/http/client.ts` | 创建独立客户端，配置传输、认证与全局响应处理 |
| `src/http/response.ts` | 检查 HTTP 状态、解包业务响应、处理上传与下载 |
| `src/http/error.ts` | 提供统一 `RequestError` 和错误分类 |
| `src/mock/index.ts` | 创建 Mock 适配器并配置真实请求回退 |
| `src/mock/demo.ts` | 请求示例的 Mock 分组 |

默认请求超时为 10 秒，关闭响应缓存和相同请求共享，错误交给调用方展示。Method 保留 alova 的配置能力，可按接口显式启用缓存或其他策略。环境模板、命令和加载优先级见[环境变量说明](../envs/README.md)。

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

成功码默认是数字 `0`，使用严格相等判断；响应 `{ code: 0, message: 'ok', data: value }` 解包为 `value`。`null`、`false`、`0` 和空字符串都原样保留。HTTP 204 返回 `undefined`，成功响应缺少 `data` 或不符合协议时抛出协议错误。

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

全局成功拦截器抛出的 HTTP、业务或协议错误不会进入全局 `onError`；它们直接拒绝当前请求。传输错误在 `onError` 中归一化并重新抛出，避免失败被吞掉。[拦截器规则见官方文档](https://alova.js.org/zh-CN/tutorial/getting-started/basic/global-interceptor/)。

## 认证与不同响应格式

有登录状态后，通过 `createHttpClient` 注入读取 Token 的函数。每次实际发送时都会读取最新值，重复发送同一个 Method 也会清理此前注入的认证头。所有实例默认使用 `appEnv.authHeaderName` 和 `appEnv.authTokenPrefix`，无需逐个传入环境配置。

```ts
import { appEnv } from '@/config/env'
import { createHttpClient } from '@/http'

const accountHttp = createHttpClient({
  baseURL: appEnv.apiBaseURL,
  timeout: appEnv.requestTimeout,
  successCode: 200,
  getToken: () => uni.getStorageSync('access_token') || undefined,
})

accountHttp.Get('/public', { meta: { auth: false } })
```

默认鉴权格式为 `Authorization: Bearer <token>`。服务端要求 `X-Token: <token>` 时，在对应的 `envs/.env.[mode].local` 中设置：

```dotenv
VITE_AUTH_HEADER_NAME=X-Token
VITE_AUTH_TOKEN_PREFIX=
```

请求头名称和前缀都会移除首尾空白；前缀非空时与 Token 之间自动加入一个空格，空字符串表示直接发送 Token。需要对接不同鉴权协议的服务时，可在单个客户端覆盖环境默认值：

```ts
const legacyHttp = createHttpClient({
  baseURL: 'https://legacy-api.example.com',
  authHeaderName: 'X-Session',
  authTokenPrefix: '',
  getToken: () => uni.getStorageSync('legacy_token') || undefined,
})
```

注入 Token 前，仅清理名称与配置相同的旧请求头，比较时忽略大小写；其他请求头保持原样。`getToken` 返回空值时也会清理该目标头，避免退出登录后重复发送旧 Token。`auth: false` 跳过读取与清理，保留调用方主动设置的认证头。

公共客户端暂未绑定登录存储，环境变量只控制鉴权格式，Token 来源仍需运行时注入。独立客户端默认使用真实 uni 适配器，需要模拟时可通过 `requestAdapter` 显式传入适配器。环境变量加载与优先级见[请求环境配置](../envs/README.md#请求环境配置)。

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

## Mock 开关与扩展

`development`、`test` 模板默认开启 Mock；`production` mode 始终关闭。测试构建使用 `build:test`，仍可包含 Mock。生产剔除条件直接使用 `import.meta.env` 编译常量，Mock 数据和适配器都在工厂函数中延迟创建，便于构建器移除整个不可达分支。调整初始化方式后应检查 H5 与小程序生产产物，避免顶层创建 Mock 留下代码。

Mock 使用 `matchMode: 'methodurl'`，路径与 Method 中的 URL 对应，不包含 API 根地址。查询参数通过 `params` 配置传入，回调从 `query` 读取：

```ts
http.Get('/demo/request', { params: { scenario: 'empty' } })
```

现有 GET 示例支持成功、`empty`、`business-error`、`http-error`；POST 示例回显非空 `message`，空消息返回业务失败。取消和超时由适配器根据请求操作与配置处理。

新增 mock 时，按业务域新增工厂函数，并在 `createMockAdapter` 中注册：

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

`onMockResponse: uniappMockResponse` 将模拟结果转换为 uni 格式，无需浏览器 `Response`。当前官方转换器不保留自定义响应头，Mock 也不模拟上传、下载进度。当前 `@alova/mock` 超时会拒绝请求，但不会取消尚未执行的 Mock 回调；回调应以生成数据为主，涉及副作用的场景不能据此推断服务端已取消。[适配源码](https://github.com/alovajs/alova/blob/main/packages/adapter-uniapp/src/mockResponse.ts)、[Mock 请求实现](https://github.com/alovajs/alova/blob/main/packages/adapter-mock/src/MockRequest.ts)。
