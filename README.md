# uniapp-template

基于 [create-uni](https://uni-helper.js.org/create-uni/core) 的 uni-app、Vue 3 与 TypeScript 项目模板，提供分包页面、导航与 TabBar、Pinia 状态管理、请求与 Mock，以及 Wot UI 和 z-paging 示例。

## 开始开发

使用 [.nvmrc](.nvmrc) 指定的 Node.js 22.22.2，pnpm 版本由 `package.json` 固定为 12.4.1。

```sh
npm install --global pnpm@12.4.1
pnpm install --frozen-lockfile
pnpm dev
```

默认启动 H5，开发端口为 `13000`，实际地址以终端输出为准。平台名作为 unh 的位置参数传入：

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | H5 开发 |
| `pnpm dev wx` | 微信小程序开发，编译后自动打开开发者工具 |
| `pnpm dev:test` | 使用 test 环境启动 H5 |
| `pnpm build` | H5 正式构建，产物位于 `dist/build/h5` |
| `pnpm build mp-weixin` | 微信小程序正式构建 |
| `pnpm build:test` | H5 测试环境构建，额外复制产物到 `dist/test/h5` |

微信开发前，复制本机环境模板并填写 `UNI_MP_WEIXIN_APPID`：

```sh
cp envs/.env.local.example envs/.env.local
```

本机环境文件已被 Git 忽略。未配置 AppID 时，产物使用 `touristappid`，开发者工具的自动打开流程会报 AppID 不存在。

## 配置与调试

环境文件集中在 `envs/`，提供 development、test、production 模板。API 地址、鉴权格式和 Mock 开关通过环境变量配置，业务代码从 `appEnv` 读取解析后的值。development 和 test 默认开启 Mock，未匹配的接口转发真实服务；production 关闭 Mock。文件覆盖顺序与联调方式见[环境变量说明](envs/README.md)。修改环境文件后需重启命令。

页面全局配置在 [pages.config.ts](pages.config.ts)，应用与平台配置在 [manifest.config.ts](manifest.config.ts)，主题及底栏模式在 [src/configs/theme.ts](src/configs/theme.ts)。`src/pages.json` 和 `src/manifest.json` 由启动命令生成，配置修改应写入对应源文件。

H5 的 UnoCSS Inspector 位于 <http://localhost:13000/__unocss/>，端口与开发服务一致。未授权浏览器打开后，在终端 `Devframe` 提示框中查看 `auth code` 并输入页面；授权按浏览器保存。验证码过期时点击 `Re-issue one-time code`，再到终端查看新码。

## 页面与分包

主包页面位于 `src/pages`，分包将页面、组件、状态、样式和专属资源归集到各自目录：

```text
src/
├── pages/
└── packages/
    └── <包名>/
        ├── pages/
        ├── components/
        ├── styles/
        └── static/
```

[插件配置](plugins/vite/index.ts) 使用 `src/packages/*/pages` 扫描分包页面，通过 `root` 函数计算分包根，并排除隐藏目录。例如 `src/packages/demo/pages/index.vue` 对应 `/packages/demo/pages/index`；没有页面的包不写入分包配置。

根组件与分包优化插件在创建时读取 `pages.json`，因此先执行 `await UniPages(...).prepare({ platformSuffix: true })` 生成页面配置和路由类型，再创建这些插件。平台后缀页面用于主包；分包和 TabBar 使用跨平台通用路径。

页面插件监听页面增删、`pages.config.ts` 及其本地依赖，修改主题配置后会重新生成页面产物。新增、删除或重命名整个分包时，应重启开发命令，让分包优化插件重新读取包结构。

包内组件与状态使用显式导入，公共组件与逻辑沿用自动导入规则。主 tab 页使用主包薄入口，业务视图放在分包；跨包组件、页面布局和导航的接入约定见[页面容器与导航](docs/page-layouts.md)。

## 检查与测试

```sh
pnpm type-check
pnpm lint
pnpm test
```

`type-check` 依次检查 `tsconfig.app.json`、`tsconfig.node.json` 和 `tsconfig.test.json`，分别覆盖业务代码、构建工具和测试。可用 `type-check:app`、`type-check:node`、`type-check:test` 单独运行；根 `tsconfig.json` 仅关联子项目。

测试文件与被测代码放在一起，运行器位于 `tools/testing` 工作区，使用 Vitest 4 和 Vite 6；应用构建使用 DCloud 配套的 Vite 5。测试按平台执行条件编译，H5 项目覆盖全部测试文件，微信项目补充 TabBar 与页面接入测试：

```sh
pnpm test --project h5
pnpm test --project mp-weixin
```

## 部署

[GitHub Pages 工作流](.github/workflows/deploy-pages.yml) 在推送到 `main` 或手动触发时执行 H5 构建，将 `dist/build/h5` 部署到 GitHub Pages。

## 文档

| 文档 | 内容 |
| --- | --- |
| [环境变量](envs/README.md) | 环境文件优先级、API 与鉴权配置、Mock 开关、客户端变量类型 |
| [页面容器与导航](docs/page-layouts.md) | 页面与组件边界、分包归属、导航、安全区和滚动区域 |
| [TabBar 接入](docs/tabbar.md) | 底栏组件、受控交互、主题配置与平台接入 |
| [组件生命周期](docs/component-lifecycle.md) | 异步组件、引用就绪与小程序生命周期 |
| [请求层与 Mock](docs/request.md) | 接口定义、公共请求头、错误处理、登录态与 Mock |
| [静态资源](src/static/README.md) | 图片和图标来源及使用约定 |
