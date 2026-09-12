# uniapp-template

基于 [create-uni](https://uni-helper.js.org/create-uni/core) 脚手架初始模版封装建设。

## 开发环境

推荐使用 `.nvmrc` 指定的 Node.js 22.22.2。pnpm 版本由 `package.json` 的 `packageManager` 固定为 12.4.1。

首次从旧版 pnpm 切换时，可用 npm 引导，确保 pnpm 12 的原生可执行文件完成安装：

```sh
npm install --global pnpm@12.4.1
```

日常开发命令：

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm type-check
pnpm lint
pnpm build
pnpm build mp-weixin
```

平台名是 unh 的位置参数；测试环境构建使用 `pnpm build:test`。主要依赖的兼容范围、迁移原因与验证结果见[依赖升级记录](docs/dependencies/dependency-upgrade-2026-09-12.md)。

微信开发使用 `pnpm dev wx`，编译完成后会自动打开微信开发者工具。请先复制 `envs/.env` 为 `envs/.env.local`，填写 `UNI_MP_WEIXIN_APPID`，然后启动开发服务。本机环境文件已被 Git 忽略；环境变量及多环境配置见 [envs/README.md](envs/README.md)。未配置 AppID 时，产物使用 `touristappid`，当前开发者工具的自动打开流程会报 AppID 不存在。

H5 开发时，UnoCSS Inspector 地址为 <http://localhost:13000/__unocss/>，端口以开发服务实际输出为准。当前版本不会自动打印入口地址；未授权浏览器打开该页面后，在运行 `pnpm dev` 的终端查看 `Devframe` 提示框中的 `auth code`，输入页面完成授权。授权按浏览器保存；已授权浏览器可以直接进入。验证码过期时提交或刷新页面，再查看终端中的新码。

## 类型检查与测试

`tsconfig.json` 只关联子项目，业务与工具配置分别维护类型环境：

| 配置 | 范围 |
| --- | --- |
| `tsconfig.app.json` | `src` 中的业务代码与 Vue 组件，使用 DOM、uni-app 平台类型和 Volar 插件，排除测试 |
| `tsconfig.node.json` | 根目录 TypeScript 工具配置、`plugins` 与工具脚本，使用 Node 类型，不引入 DOM |
| `tsconfig.test.json` | 业务和插件测试、测试运行器配置，组合应用与 Node 环境 |

`pnpm type-check` 依次检查三个子项目；也可通过 `type-check:app`、`type-check:node`、`type-check:test` 单独执行。直接对根配置运行 `tsc --noEmit` 不会递归检查这些引用项目。

unh 的环境变量类型生成功能已关闭（`env.dts: false`）；构建配置与客户端变量的读取范围见[环境变量说明](envs/README.md#客户端变量与类型)。

测试运行器位于 `tools/testing` 工作区，使用 Vitest 4.1.11 和 Vite 6.4.3；应用构建继续使用 DCloud 配套的 Vite 5.2.8。`pnpm test` 保持为统一入口，测试文件仍与被测代码放在一起。测试配置中的模块别名与 `tsconfig.test.json` 的路径映射共同保证它们加载同一套测试依赖。

测试使用 DCloud 预处理器执行平台条件编译：H5 项目运行全部用例，微信项目补充运行 TabBar 及页面接入用例。可通过 `pnpm test --project h5` 或 `pnpm test --project mp-weixin` 单独验证；平台专有用例只在对应项目运行。

业务配置未显式加载 Node 类型，但 uni-pages 的声明会间接引入部分 Node 全局；配置拆分不等于禁止传递依赖引入类型。业务代码仍应使用 uni-app 的平台 API。

## 分包目录

主包页面放在 `src/pages`，分包按 `src/packages/<包名>/pages` 组织：

```text
src/
├── pages/
└── packages/
    └── demo/
        ├── pages/
        │   ├── index.vue
        │   └── hi.vue
        └── components/
            └── Demo.vue
```

开发与构建启动时自动发现 `src/packages` 下非隐藏的直属目录，只扫描各包的 `pages`。例如 `demo/pages/index.vue` 会生成分包根 `packages/demo` 和页面路径 `pages/index`，完整跳转路径为 `/packages/demo/pages/index`。没有页面的包不会写入分包配置。

分包扫描配置集中在 [plugins/vite/pages.ts](plugins/vite/pages.ts)，使用 `src/packages/*/pages` 匹配页面目录，再由 `root` 函数计算分包根。glob 扫描与插件的 `prepare()` 接口由项目维护的 [uni-pages 补丁](docs/dependencies/dependency-upgrade-2026-09-12.md#uni-pages分包扫描与提前准备)提供。

创建其他插件前，先等待 `pages.prepare()` 生成完整的 `pages.json` 和路由类型；Vite 随后接管同一个插件实例，复用已准备的上下文。项目显式启用 `platformSuffix`，使准备阶段就能确定平台文件规则。

包内组件、composables 等资源使用显式导入；公共组件与公共逻辑继续使用现有自动导入规则。页面插件会自动发现分包新增、删除和重建。由于本项目的分包优化插件在初始化时读取包结构，新增或重命名整个分包后仍需重启开发命令；已有分包内的页面增删继续由页面插件监听。

## TabBar 与页面导航

自定义 TabBar 提供基础版和动画版。配置方式、组件层级与页面接入约定见 [TabBar 与页面导航](docs/tabbar.md)。

## TODO

### Basic
- [x] uniapp3 + vue3 + typescript
- [x] eslint
- [x] unocss

### 开发优化
- [x] [unplugin-auto-import/vite](https://github.com/antfu/unplugin-auto-import): 按需自动导入API
- [x] [@uni-helper/unh](https://github.com/uni-helper/unh): uniapp cli 启动命令二次封装，简化运行脚本指令，增强开发体验
- [x] [@uni-helper/plugin-uni](https://github.com/uni-helper/plugin-uni): uni插件的ESM导出，于 uni-app 构建体系中实现 ESM-First
- [x] [@uni-helper/vite-plugin-uni-components](https://uni-helper.js.org/vite-plugin-uni-components): 实现组件库的按需引用及类型生成
- [x] [@uni-helper/vite-plugin-uni-pages](https://github.com/uni-helper/vite-plugin-uni-pages): 实现文件路由
- [x] [@uni-helper/vite-plugin-uni-layouts](https://github.com/uni-helper/vite-plugin-uni-layouts): 实现 layout 系统
- [x] [@uni-helper/vite-plugin-uni-manifest](https://github.com/uni-helper/vite-plugin-uni-manifest): 使用 TypeScript 来编写 uni-app 的 manifest.json
- [x] [@uni-helper/vite-plugin-uni-platform](https://uni-helper.js.org/vite-plugin-uni-platform): 实现文件级别的平台条件编译
- [x] [@uni-ku/root](https://github.com/uni-ku/root): 实现虚拟根组件
- [ ] [@uni-ku/bundle-optimizer](https://github.com/uni-ku/bundle-optimizer): Uniapp Vue3 版本的分包优化实现

### 实用库
- [x] [uni-echarts](https://github.com/xiaohe0601/uni-echarts): 适用于 uni-app 的 Apache ECharts 组件
- [x] pinia + [pinia-plugin-persistedstate](https://praz.codeberg.page/pinia-plugin-persistedstate): 全局状态管理及持久化
- [ ] 路由管理
- [ ] [alova](https://alova.js.org/zh-CN/tutorial/getting-started/introduce) 请求库的支持

### 业务增强
- [ ] layouts 的建设：自定义 tabbar、navbar，以及实现布局的动态切换
- [ ] 全局样式、主题的建设
- [ ] 网络请求封装
- [ ] 业务模型声明
- [ ] 可复用组件：echarts 图表的封装；常用组件、具体业务模块的组件封装以及分包优化的考虑
- [ ] 国际化支持
- [ ] Webview 模式的支持
