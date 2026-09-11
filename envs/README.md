# 环境变量

环境文件统一放在此目录。`unh` 在预生成配置前加载环境变量，Vite 使用相同的环境目录。

首次配置：

```sh
cp envs/.env envs/.env.local
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
| `.env.[mode]` | 指定模式的共享配置 | 是，按需创建 |
| `.env.[mode].local` | 指定模式的本机覆盖值 | 否，按需创建 |

文件按表格顺序加载，后者覆盖前者；启动命令时已有的环境变量优先级最高。`pnpm dev wx` 使用 `development`，`pnpm build mp-weixin` 使用 `production`，`--mode test` 使用 `test`。本机文件由根目录 `.gitignore` 中的 `*.local` 规则排除。

`UNI_` 前缀用于构建配置，通过 `process.env` 读取；需要在业务代码中通过 `import.meta.env` 读取的变量使用 `VITE_` 前缀，其值会进入客户端产物。

## 客户端变量与类型

`unh.config.ts` 使用 `env.dts: false`，不自动生成环境变量类型声明，避免把仅供构建使用的 `UNI_` 变量声明为客户端可用变量。

`UNI_MP_WEIXIN_APPID` 仅在构建配置中通过 `process.env` 读取，没有通过 Vite 的 `envPrefix` 或 `define` 注入业务 JS。Vite 默认只向客户端暴露 `VITE_` 变量，业务代码不要读取 `import.meta.env.UNI_MP_WEIXIN_APPID`。

微信 AppID 仍会写入小程序项目配置，作为应用标识使用；它不能像 AppSecret 那样依靠客户端保密。AppSecret 等服务端密钥不应进入小程序配置或 `VITE_` 变量。
