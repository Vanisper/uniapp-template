# 环境变量

环境文件统一放在此目录。`unh` 在预生成配置前加载环境变量，Vite 使用相同的环境目录。

首次配置：

```sh
cp envs/.env.local.example envs/.env.local
```

在 `envs/.env.local` 中填写自己的微信小程序 AppID：

```dotenv
UNI_MP_WEIXIN_APPID=你的小程序AppID
```

随后运行 `pnpm dev wx`。该变量映射到 `manifest.config.ts` 的 `mp-weixin.appid`，与文件顶部的 uni-app 应用标识 `appid` 不同。修改环境文件后需要重启开发或构建命令。

`src/manifest.json` 由启动命令根据配置和环境变量生成，不纳入 Git；无需手工创建或修改。

## 文件与优先级

| 文件 | 用途 | 是否纳入 Git |
| --- | --- | --- |
| `.env` | 所有模式的公共默认值 | 是 |
| `.env.local` | 本机公共覆盖值 | 否 |
| `.env.development` | 本地开发配置，默认启用 Mock | 是 |
| `.env.test` | 测试环境配置，默认启用 Mock | 是 |
| `.env.production` | 正式环境配置，关闭 Mock | 是 |
| `.env.[mode].local` | 指定模式的本机覆盖值 | 否，按需创建 |

每次只加载当前 mode 的配置：`.env` → `.env.local` → `.env.[mode]` → `.env.[mode].local`，后者覆盖前者；启动命令时已有的环境变量优先级最高。模式专属配置也会覆盖 `.env.local`，因此切换 Mock 时应写入对应的 `.env.[mode].local`。本机文件由根目录 `.gitignore` 中的 `*.local` 规则排除，`.example` 文件只是复制模板，不参与加载。

| 命令 | mode | Mock 默认状态 |
| --- | --- | --- |
| `pnpm dev`、`pnpm dev wx` | `development` | 开启 |
| `pnpm dev:test`、`pnpm dev:test wx` | `test` | 开启 |
| `pnpm build:test`、`pnpm build:test mp-weixin` | `test` | 开启 |
| `pnpm build`、`pnpm build mp-weixin` | `production` | 关闭 |

mode 和开发/构建命令是两个维度。`build:test` 会生成优化后的测试包，并保留启用的 Mock；只有 `production` mode 强制关闭 Mock。H5 测试构建会额外复制到 `dist/test/h5`，原始产物仍位于 `dist/build/h5`。

需要 `staging` 等自定义 mode 时，新增 `.env.staging`，再运行 `pnpm dev --mode staging` 或 `pnpm build --mode staging`。`appEnv.mode` 保留实际 mode 字符串，不限制为内置的三个值。

## 请求环境配置

| 变量 | 公共默认值 | 约束 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 空字符串 | 空值或包含主机的完整 HTTP(S) 地址，可带路径前缀；不含查询参数或片段 |
| `VITE_REQUEST_TIMEOUT` | `10000` | 请求超时毫秒数，有限正数 |
| `VITE_AUTH_HEADER_NAME` | `Authorization` | 非空的 HTTP 请求头名称，移除首尾空白 |
| `VITE_AUTH_TOKEN_PREFIX` | `Bearer` | Token 前缀，不含控制字符；移除首尾空白，空字符串表示直接发送 Token |
| `VITE_MOCK_DELAY` | `500` | Mock 响应延迟毫秒数，有限正数 |
| `VITE_MOCK_ENABLED` | `false` | 只接受字符串 `true` 或 `false`；development、test 模板覆盖为 `true` |

客户端环境变量由 [`src/config/env.ts`](../src/config/env.ts) 的 `appEnv` 统一解析。缺失变量使用上述默认值；显式配置的空时间、无效数字、无效地址、鉴权格式或开关会抛出带变量名的配置错误。地址首尾空白及末尾斜杠会被移除。

API 地址允许留空。接入真实服务时应填写完整 HTTP(S) 地址；小程序部署使用 HTTPS 并配置请求域名。

本地开发联调可复制现有模板：

```sh
cp envs/.env.development.local.example envs/.env.development.local
pnpm dev
```

先把模板中的 `https://dev-api.example.com/api` 替换为实际服务地址，模板设置 `VITE_MOCK_ENABLED=false` 用于接口联调。测试环境可将同一模板复制为 `envs/.env.test.local`，填写测试服务地址并运行 `pnpm dev:test`。正式环境在 `envs/.env.production.local` 或构建流水线环境变量中填写 `VITE_API_BASE_URL`；production 模式即使被覆盖为 `VITE_MOCK_ENABLED=true`，解析后的 Mock 开关也始终为 false。

服务端要求 `X-Token: <token>` 时，在对应的 `envs/.env.[mode].local` 中配置：

```dotenv
VITE_AUTH_HEADER_NAME=X-Token
VITE_AUTH_TOKEN_PREFIX=
```

鉴权格式默认为 `Authorization: Bearer <token>`，前缀为空时表示直接使用 Token。解析后的值分别为 `appEnv.authHeaderName` 和 `appEnv.authTokenPrefix`。

这些变量只定义鉴权格式，Token 由运行时提供。修改配置后重启当前开发或构建命令。

`UNI_` 前缀用于构建配置，通过 `process.env` 读取；需要在业务代码中通过 `import.meta.env` 读取的变量使用 `VITE_` 前缀，其值会进入客户端产物。

## 客户端变量与类型

`unh.config.ts` 使用 `env.dts: false`，不自动生成环境变量类型声明，避免把仅供构建使用的 `UNI_` 变量声明为客户端可用变量。

业务变量手工声明在 [`src/typings/env.d.ts`](../src/typings/env.d.ts)，Vite 提供的 `MODE`、`DEV`、`PROD` 等内置字段继续使用 `vite/client` 类型。新增业务变量时，同步维护 `.env` 默认值、类型声明与 `src/config/env.ts` 的解析规则；业务代码优先读取 `appEnv`。

`UNI_MP_WEIXIN_APPID` 仅在构建配置中通过 `process.env` 读取，没有通过 Vite 的 `envPrefix` 或 `define` 注入业务 JS。Vite 默认只向客户端暴露 `VITE_` 变量，业务代码不要读取 `import.meta.env.UNI_MP_WEIXIN_APPID`。

微信 AppID 仍会写入小程序项目配置，作为应用标识使用；它不能像 AppSecret 那样依靠客户端保密。AppSecret 等服务端密钥不应进入小程序配置或 `VITE_` 变量。
