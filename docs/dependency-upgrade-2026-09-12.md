# 2026-09-12 依赖升级调查

本次以 uni-app 正式版工具链的兼容约束为基础，调查全部直接依赖和包管理器。升级目标既包括版本更新，也包括修正已存在的依赖搭配和接入偏移。不能用一次 `update --latest` 代替这些判断。

原版本取自 `main` 的 `82b45f58f01d57f6b873a35625dd03cf142af0f9`，调查时间为 2026-09-11 至 2026-09-12。版本依据包括 npm 元数据、官方模板、发布日志及对应版本的源码、类型声明。共核查原有 58 项直接依赖，调整其中 47 项声明，保留 11 项，新增 3 项显式开发依赖，并升级包管理器和对应 CI 安装 Action。下表列出最终目标；执行验证与提交记录见文末。

## 版本矩阵

“保持”表示已核查可用版本后保留；“对齐”表示修正原本超出兼容范围的依赖。原声明保留版本范围符号，目标列表示本次选定的具体版本；“新增”表示原来没有直接声明，本次为明确配置依赖或回归测试补充。

### uni-app 运行时和编译器

| 依赖 | 原声明 | 目标版本 | 决策与理由 |
| --- | --- | --- | --- |
| DCloud 同批次包，共 20 个 | `3.0.0-4080720251210001` | `3.0.0-5020420260813003` | 升级到官方 Vue 3 模板使用的 5.24 正式批次，全部保持一致 |
| `@dcloudio/types` | `3.4.19` | `3.4.31` | 匹配新正式批次精确 peer；不采用较新的 `3.4.32` |
| `vue` | `3.4.21` | `3.4.21` | 保持，与 DCloud 编译器及平台运行时配套 |
| `@vue/runtime-core` | `3.4.21` | `3.4.21` | 保持，避免 Vue 类型与运行时漂移 |
| `vite` | `5.2.8` | `5.2.8` | 保持，DCloud 插件的 peer 精确限定该版本 |
| `@vitejs/plugin-vue` | `^5.2.4` | `5.2.4` | 保持，与 DCloud 同批次内置依赖对齐 |
| `pinia` | `2.2.4` | `2.2.4` | 保持，后续版本要求 Vue `^3.5.11` |
| `pinia-plugin-persistedstate` | `^4.7.1` | `4.1.3`，精确锁定 | 对齐，4.2 起已超出 Pinia 2.2.4 支持范围 |
| `vue-i18n` | `9.6.2` | `9.14.5` | 更新 9.x 根依赖，保留 DCloud 平台兼容边界 |
| `sass` | `1.64.2` | `1.104.0` | 更新 1.x，保留目前 Vite 所需的 legacy API |

DCloud 同批次包具体包括：

- 运行时：`@dcloudio/uni-app`、`uni-app-harmony`、`uni-app-plus`、`uni-components`、`uni-h5`
- 小程序：`@dcloudio/uni-mp-alipay`、`uni-mp-baidu`、`uni-mp-harmony`、`uni-mp-jd`、`uni-mp-kuaishou`、`uni-mp-lark`、`uni-mp-qq`、`uni-mp-toutiao`、`uni-mp-weixin`、`uni-mp-xhs`
- 其他平台与工具：`@dcloudio/uni-quickapp-webview`、`uni-automator`、`uni-cli-shared`、`uni-stacktracey`、`vite-plugin-uni`

上述简写均属于 `@dcloudio` scope。批次内各包共享发布版本，作为一个兼容单元升级。依据见 [DCloud 官方模板](https://github.com/dcloudio/uni-preset-vue/blob/vite-ts/package.json)、[正式版插件元数据](https://registry.npmjs.org/@dcloudio%2Fvite-plugin-uni/3.0.0-5020420260813003)及 [uni-app 正式版元数据](https://registry.npmjs.org/@dcloudio%2Funi-app/3.0.0-5020420260813003)。

### 构建插件与组件依赖

| 依赖 | 原声明 | 目标版本 | 决策与理由 |
| --- | --- | --- | --- |
| `@uni-helper/plugin-uni` | `0.1.0` | `0.1.0` | 保持，已是 latest |
| `@uni-helper/unh` | `^0.2.10` | `0.3.2`，精确锁定并打补丁 | 修复构建失败的退出状态与后置 hook，见补丁说明 |
| `@uni-helper/uni-types` | `^1.0.0-alpha.7` | `1.1.0`，声明 `^1.1.0` | 更新稳定版类型；最新 1.3.0 尚处于 pnpm 默认 24 小时发布等待期 |
| `@uni-helper/unocss-preset-uni` | `^0.2.11` | `0.4.0`，精确锁定 | 与 UnoCSS 66.8.1 配套，保持整条插件链支持 Vite 5 |
| `@uni-helper/vite-plugin-uni-components` | `^0.2.6` | `0.3.2` | 更新组件扫描与解析器，修复导入变量命名 |
| `@uni-helper/vite-plugin-uni-layouts` | `^0.1.11` | `0.1.11` | 保持，已是 latest |
| `@uni-helper/vite-plugin-uni-manifest` | `^0.2.12` | `0.6.0` | 更新配置类型及生成生命周期，适配 ESM 入口 |
| `@uni-helper/vite-plugin-uni-pages` | `^0.3.22` | `0.5.0` | 更新路由生成、平台合并，迁移类型入口 |
| `@uni-helper/vite-plugin-uni-platform` | `^0.0.5` | `0.1.2` | 修复平台文件路径解析 |
| `@uni-ku/bundle-optimizer` | `^2.2.0` | `2.2.0` | 保持，已是 latest |
| `@uni-ku/root` | `^1.4.1` | `1.5.0` | 新增 nvue 支持，修复分包字段及路径匹配 |
| `unocss` | `66.0.0` | `66.8.1`，精确锁定 | 匹配 uni 预设，并避开新版 inspector 的 Vite 7/8 要求 |
| `unplugin-auto-import` | `^19.1.0` | `21.1.0` | 适配 ESM-only，排除 Vue 3.4 不提供的 API 并覆盖生成声明 |
| `echarts` | `^6.0.0` | `6.1.0` | 更新图表修复，核查 minor 中的破坏性变化 |
| `uni-echarts` | `^2.4.1` | `2.5.3` | 更新手势兼容及 Vite 自动配置 |
| `z-paging` | `^2.8.8` | `2.8.8` | 保持，已是 latest |

### 测试、类型、静态检查与包管理器

| 依赖或工具 | 原声明 | 目标版本 | 决策与理由 |
| --- | --- | --- | --- |
| `vitest` | `^2.1.9` | `3.2.7` | 采用支持 Vite 5 的维护版本，不进入 4/5 |
| `happy-dom` | `^15.11.7` | `20.14.3` | 更新 DOM 测试环境，核查 ESM 与执行默认值 |
| `@vue/test-utils` | `^2.4.11` | `2.5.0` | 更新 Vue 测试工具，核查组件卸载行为 |
| `typescript` | `^5.9.3` | `6.0.3`，限制在 6.0.x | 保留 Vue/Volar 所需的编译器 API，不进入 TS 7 |
| `vue-tsc` | `^3.2.1` | `3.3.11` | 配套 TypeScript 6 |
| `@vue/tsconfig` | `^0.8.1` | `0.9.1` | 升级并通过 `extends` 实际启用 |
| `@types/node` | `^25.0.3` | `22.20.2` | 对齐实际验证的 Node 22 运行环境 |
| `eslint` | `^9.39.2` | `10.10.0` | 与新 uni-helper ESLint 配置配套 |
| `@uni-helper/eslint-config` | `^0.6.1` | `0.7.5` | 新版 peer 要求 ESLint 10 |
| `@antfu/eslint-config` | 新增直接依赖 | `9.5.1`，精确锁定 | 显式匹配 uni-helper 配置及 ESLint 10 |
| `unocss-applet` | 新增直接依赖 | `0.14.0`，精确锁定 | 用真实属性转换器执行回归测试，与 uni preset 0.4.0 对齐 |
| `magic-string` | 新增直接依赖 | `1.2.2`，精确锁定 | 属性转换回归直接使用源码编辑 API |
| `miniprogram-api-typings` | `^4.1.2` | `5.2.3` | 更新微信 API 类型，核查原生构造器类型变化 |
| `@mini-types/alipay` | `^3.0.14` | `3.0.14` | 保持，已是 latest |
| `@iconify-json/carbon` | `^1.2.15` | `1.2.27` | 更新图标数据，现用图标名称仍存在 |
| `@iconify-json/line-md` | `^1.2.16` | `1.2.16` | 保持，已是 latest |
| pnpm | `10.32.1` | `12.4.1` | 更新包管理器，迁移工作区配置与构建许可 |
| `pnpm/action-setup`（CI） | `v4` | `v6.1.0` | 配套 pnpm 12 的安装引导 |

## 决定升级上限的兼容关系

### DCloud 正式批次优先于 dist-tag

调查时，多数 DCloud 包的 `latest` 指向 Vue 2 系列，`vite-plugin-uni` 的 `latest` 仍是旧 alpha，`vue3` 则指向另一条使用 Vite 8 的实验发布线。标签名称不能单独证明它是当前项目需要的 Vue 3 正式版。因此本次以官方模板和正式发布版本交叉核对，选定 `3.0.0-5020420260813003`。

该正式批次仍使用 Vue 3.4.21、Vite 5.2.8 和 plugin-vue 5.2.4。uni-helper 的 pages、components、manifest、platform 与 uni-ku/root 最新版也仍声明 Vite 5，bundle-optimizer 声明 Vite 4/5。独立把根 Vite 升到 8 或 Vue 升到 3.5，会让运行时、编译器和插件超出已声明的配套关系。[DCloud 官方模板](https://github.com/dcloudio/uni-preset-vue/blob/vite-ts/package.json)、[正式版编译共享包](https://registry.npmjs.org/@dcloudio%2Funi-cli-shared/3.0.0-5020420260813003)

Pinia 2.2.5 起要求 Vue `^3.5.11`，所以保留 2.2.4。persistedstate 4.2 要求 Pinia `>=2.3.0`，4.3 起要求 `>=3.0.0`；原来的 4.7.1 搭配 Pinia 2.2.4 已经偏离支持范围。修正到精确 4.1.3 后，不能再使用 `^4.1.3`，否则后续更新锁文件仍可选入不兼容的 4.x。[Pinia 2.2.5 peer](https://registry.npmjs.org/pinia/2.2.5)、[persistedstate 4.1.3 元数据](https://registry.npmjs.org/pinia-plugin-persistedstate/4.1.3)、[persistedstate 变更记录](https://github.com/prazdevs/pinia-plugin-persistedstate/blob/main/CHANGELOG.md)

### 测试和类型工具跟随编译链

Vitest 3.2.7 仍接受 Vite 5；4 要求 Vite 6，5 要求 Vite 6.4 及以上，因此本次止于维护中的 3.x。TypeScript 7.0 已经正式发布，但原生编译器的 API 不能直接替换 vue-tsc/Volar 使用的旧编译器 API，所以选定 TypeScript 6.0.3 和 vue-tsc 3.3.11。较大的版本号不是兼容性的替代证据。[Vitest 3.2.7 元数据](https://registry.npmjs.org/vitest/3.2.7)、[Vitest 4 迁移](https://vitest.dev/guide/migration.html)、[TypeScript 7 公告](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)、[Vue Language Tools 发布记录](https://github.com/vuejs/language-tools/releases)

完整工具图的 Node 要求为 `^22.22.2 || ^24.15.0 || >=26.0.0`。其中 uni-pages 0.5 的 Babel 8 依赖和 ESLint 插件都有比“Node 22”更精确的补丁版本要求。本次采用 Node 22.22.2 验证，并将 `@types/node` 对齐 22.x；类型包声明更高版本的 API，并不能让较低版本 Node 获得这些能力。[uni-pages 0.5 迁移说明](https://github.com/uni-helper/vite-plugin-uni-pages/blob/v0.5.0/packages/core/README.md)、[Vue tsconfig 说明](https://github.com/vuejs/tsconfig)

## 破坏性变更与实际接入偏移

### 应用入口与持久化

原 `createApp()` 将 `setupPinia(app)` 返回的 Pinia 实例作为 `Pinia` 字段返回。DCloud 的 App/nvue 编译流程把该字段挂到 `uni.Pinia`，用于承接模块导出；实例没有 `defineStore` 等模块方法。入口已改为导入 `import * as Pinia from 'pinia'`，独立执行 `setupPinia(app)`，然后返回 `{ app, Pinia }`。这项修正来自平台接入契约，随本次升级一并落实。[uni-app 官方 Pinia 接入说明](https://uniapp.dcloud.net.cn/tutorial/vue3-pinia.html)

persistedstate 4.1.3 默认使用 `destr`，原 4.7.1 默认使用 `JSON.parse`。版本对齐时已显式设置 `JSON.stringify` / `JSON.parse` serializer，保持当前 JSON 读写约定。新增真实 store 回归覆盖缓存恢复、更新写回、零值和损坏缓存。[persistedstate 4.1.3 源码](https://github.com/prazdevs/pinia-plugin-persistedstate/blob/v4.1.3/src/index.ts)

Pinia 3 移除旧 `defineStore({ id })`、Vue 2 等支持，Pinia 4 进一步转 ESM-only 并调整 devtools peer。本项目已经使用 setup store，未命中旧定义写法；保留旧版的原因是 Vue 配套约束。未将 store 内未返回、不会进入持久化状态的运行时标记误判为缓存问题。[Pinia 3 迁移](https://pinia.vuejs.org/cookbook/migration-v2-v3.html)、[Pinia 4 发布说明](https://github.com/vuejs/pinia/releases/tag/v4.0.0)

### 路由配置与类型入口

uni-pages 0.4 移除了 `<route>` 自定义块与旧 Volar 服务；0.5 转为 ESM-only，并调整生命周期 hook 签名。项目已有 `type: module`，页面使用顶层 `definePage`，没有旧 `<route>` 或受影响的 hook，因此不需要机械重写页面声明。

实际命中的迁移有两处：

- `PageMetaDatum` 不再导出，`usePages.ts` 改用已验证导出的 `InternalPageItem`
- `tsconfig.json` 的类型入口改为 `@uni-helper/vite-plugin-uni-pages/client`，以加载 `definePage` 全局和虚拟模块声明

`UserPagesConfig` 仍以兼容类型导出，无需将它视为删除 API。0.5 同时修正 `softinputMode` / `softinputNavBar` 拼写，并把只对页面有效的 `disableScroll` / `disableSwipeBack` 移出全局样式类型；当前配置未使用这些旧字段。[uni-pages 0.5 README](https://github.com/uni-helper/vite-plugin-uni-pages/blob/v0.5.0/packages/core/README.md)、[类型定义](https://github.com/uni-helper/vite-plugin-uni-pages/blob/v0.5.0/packages/core/src/types.ts)

路由扫描从 fast-glob 转向 tinyglobby，0.5 还引入生成标记、平台条件合并和过期分包清理。回归范围包含 H5 与微信构建后的首页、tabBar、分包 root 和重复页面，具体结果见文末。已有 `_*.*` 排除模式也不应被理解为任意层级的下划线文件规则；新增这类页面时需按实际扫描范围处理。

保留 unh 的页面预生成。DCloud 在 Vite 的 `config` 阶段读取并缓存 `pages.json`，而路由插件在较晚的 `configResolved` 阶段生成文件；已有 `UniPages()` 不代表可以移除 `autoGenerate.pages`。[uni-pages 生成时序说明](https://github.com/uni-helper/vite-plugin-uni-pages/blob/v0.5.0/packages/core/README.md)

### CLI hook、配置加载与自动导入

unh 0.2.11 修复 `onBuildAfter` 在构建结束前执行的问题。本项目用它把 H5 test mode 产物复制到 `dist/test/h5`，因此这项升级有直接行为价值。但 0.3.2 仍忽略构建子进程的失败结果，可能返回退出码 0 并执行后置 hook；命令分发还缺少对异步 action 的等待。本次精确固定 0.3.2 并加入补丁，确保失败会以非零退出且跳过复制，具体范围与回归见下方补丁说明。[unh 0.2.11](https://github.com/uni-helper/unh/releases/tag/v0.2.11)、[unh 0.3.2](https://github.com/uni-helper/unh/releases/tag/v0.3.2)

新 unh 和 uni-pages 都要求 `unconfig ^7.5.0`，原来三处强制 `7.3.2` 的覆盖会把已升级工具拉回上游范围外。本次已移除失效覆盖，配置加载由上游依赖范围解析，真实 CLI 的加载行为纳入回归。

manifest 0.5 及 auto-import 21 转为 ESM-only；auto-import 21 最低 Node 为 20.19。本次保留项目已有的 ESM 导入和扫描目录，auto-import 20 的 Nuxt 4 变更不适用于当前非 Nuxt 项目。[manifest 0.5 发布](https://github.com/uni-helper/vite-plugin-uni-manifest/releases/tag/v0.5.0)、[auto-import 21 发布](https://github.com/unplugin/unplugin-auto-import/releases/tag/v21.0.0)

auto-import 的 Vue preset 已包含当前 Vue 3.4.21 不提供的 `getCurrentWatcher`、`onWatcherCleanup`、`useId` 和 `useTemplateRef`。生成这些全局声明会让编辑器错误地暗示项目具备新版 API，因此显式通过 `ignore` 排除四项。实测还发现默认 `dtsMode: 'append'` 会保留已禁用的旧声明，所以同时设为 `'overwrite'`，让声明文件反映当前导入集合。不能只升级插件和生成类型，却把 Vue 运行时仍受 DCloud 约束这一点遗漏。[auto-import 配置说明](https://github.com/unplugin/unplugin-auto-import#configuration)

components 0.3 同步了上游组件扫描实现；现有 `directoryAsNamespace`、声明文件路径和两个 resolver 仍符合接口。升级实测发现，0.3.2 会根据 DCloud 传递安装的 vue-router 和 plugin-vue-jsx，自动生成 `RouterLink` / `RouterView` 和 TSX 全局声明。项目没有注册这些跨平台全局组件，安装存在不等于实际提供。因此在 `Components()` 中显式设置 `types: []` 和 `dtsTsx: false`，重新构建后声明恢复为项目真实组件集合。[components 0.3](https://github.com/uni-helper/vite-plugin-uni-components/releases/tag/v0.3.0)、[components 0.3.2](https://github.com/uni-helper/vite-plugin-uni-components/releases/tag/v0.3.2)

root 1.5 新增 nvue、支持小写分包字段并修复路径括号匹配，本次保留 `App.ku.vue` / `ku-root-view` 接入。[root 1.5](https://github.com/uni-ku/root/releases/tag/v1.5.0)

### UnoCSS 与样式兼容

新 uni 预设用默认 Wind3 替代已弃用的 presetUno，默认并未切换到 Wind4。本项目大量使用 attributify、`hover-class` 和 `--at-apply`，本次保留 `presetUni()`、directives 与 variant-group transformer 的搭配。小程序属性转 class 的转换继续由预设注册。[预设选择源码](https://github.com/uni-helper/unocss-preset-uni/blob/v0.4.0/src/presets.ts)

H5/App 默认使用 rpx→rem，小程序默认使用 rem→rpx，并自动回退小程序不支持的新颜色语法。本次组合精确固定为 uni preset 0.4.0 和 UnoCSS 66.8.1：预设及其 unocss-applet 0.14 都要求 UnoCSS `~66.8.1`，这条版本线也明确支持 Vite 5。[uni 预设选项](https://github.com/uni-helper/unocss-preset-uni/blob/v0.4.0/src/options.ts)、[预设 0.4.0 元数据](https://registry.npmjs.org/@uni-helper%2Funocss-preset-uni/0.4.0)、[applet 0.14.0 元数据](https://registry.npmjs.org/unocss-applet/0.14.0)

未采用最新 66.10.2 / preset 0.5.1 的原因在传递依赖：UnoCSS 66.10.0 起把 inspector 改为 devframe，新增的 `@devframes/vite` 只接受宿主 Vite 7/8。虽然 `@unocss/vite` 自身仍写着支持 Vite 5，其 inspector 会直接接入项目的 Vite server；单独安装一份 Vite 8，或仅设置 `inspector: false`，都不能证明整条集成链满足公开支持范围。[UnoCSS 66.10.0 发布说明](https://github.com/unocss/unocss/releases/tag/v66.10.0)、[devframes Vite peer](https://registry.npmjs.org/@devframes%2Fvite/0.9.11)

UnoCSS 单链上限虽可到 66.9.2，但 uni preset 0.4 的范围停在 66.8.x，0.5 又要求 66.10.x，两者求交后的目标是 66.8.1 / 0.4.0。66.8.1 inspector 已不再依赖旧 vue-flow-layout，也没有 devframes，因此同时消除了原 66.0.0 inspector 对更高 Vue 补丁版本的 peer 冲突，无需覆盖应用 Vue 或额外放宽 peer 规则。[inspector 66.8.1 依赖](https://registry.npmjs.org/@unocss%2Finspector/66.8.1)、[Vite 集成 66.8.1 peer](https://registry.npmjs.org/@unocss%2Fvite/66.8.1)、[预设 0.5.1 元数据](https://registry.npmjs.org/@uni-helper%2Funocss-preset-uni/0.5.1)

Sass 1.79 起提示 legacy JS API 弃用，1.80 起提示 `@import` 和全局内置函数弃用。项目源码未发现对应旧导入和颜色函数，但 DCloud 与第三方样式仍可能产生告警。Vite 5.2.8 不支持后续版本的 modern compiler 配置，不能照搬 Vite 6 建议或通过屏蔽告警宣称迁移完成。保留 1.x 是当前编译链的兼容决策。[Sass legacy API](https://sass-lang.com/documentation/breaking-changes/legacy-js-api/)、[Sass import 弃用](https://sass-lang.com/documentation/breaking-changes/import/)

### 图表和国际化的验证边界

ECharts 6.1.0 相对 6.0.0 有明确破坏性变化：

- `tooltip.valueFormatter` 第二参数变为原始数据索引，不能继续当作 dataZoom 过滤后的索引
- `axis.startValue` 不再隐含设置 `min`，需要旧行为时应同时设置两者
- 柱形、象形柱、K 线和箱线图的边缘形状默认不溢出 grid，恢复旧布局需要设置 `containShape: false`

当前项目没有图表实例或 option，这些变化没有命中业务代码。构建成功仅验证接入，不能证明实际图表交互已覆盖。uni-echarts 2.5 由插件自动添加 `optimizeDeps.exclude`，本次已移除 Vite 中重复的手写配置。[ECharts 6.1 发布说明](https://github.com/apache/echarts/releases/tag/6.1.0)、[uni-echarts 2.5](https://github.com/xiaohe0601/uni-echarts/releases/tag/v2.5.0)

vue-i18n 的根依赖更新到 9.14.5，不代表 App/小程序实际执行的国际化运行时也同步升级。DCloud 对这些平台设置 alias，指向它内置的 patched 9.1.9。项目暂未使用 `createI18n` / `useI18n`，本次保留 9.x，避免进一步扩大不同平台的 API 差距。11 的 npm peer 实际允许 Vue 3.4，因此这里是跨平台契约取舍，并非声称 11 无法安装。[DCloud 国际化接入](https://uniapp.dcloud.net.cn/tutorial/i18n.html)、[vue-i18n 11 元数据](https://registry.npmjs.org/vue-i18n/11.4.10)

Vue I18n 9/10 已结束维护，保留 9.14.5 不能消除 DCloud 内置 9.1.9 的维护限制。10 调整 legacy `t` / `$t` 的第二字符串参数语义，11 删除 `tc` / `$tc`；直接把根类型及 H5 更新到 11，而 App/小程序仍执行 9.1.9，会形成不同平台的 API 差异。后续正式接入国际化时，需要按平台验证具体 API，或等待 DCloud 更新内置运行时后再统一迁移。[Vue I18n 维护状态](https://vue-i18n.intlify.dev/guide/maintenance)、[v10 破坏性变更](https://vue-i18n.intlify.dev/guide/migration/breaking10)、[v11 破坏性变更](https://vue-i18n.intlify.dev/guide/migration/breaking11)

### TypeScript 与配置覆盖

TypeScript 6 已弃用 `baseUrl`。原值为 `.`，而路径映射本来就是 `@/*: ['./src/*']`，本次删除该项，不使用 `ignoreDeprecations`。`types`、`strict`、`module` 等已显式设置；side-effect import 检查与 `vite/client` 的样式声明一并纳入类型验证。[TypeScript 6 发布说明](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html)

原来虽然安装了 `@vue/tsconfig`，实际没有 `extends`，升级这个包不会自动改变任何编译选项。本次通过 `extends: '@vue/tsconfig/tsconfig.json'` 真正启用 0.9.1 基础配置，同时保留 uni-app 的平台 types 与 Volar 插件。继承带入的 `noEmit`、`allowImportingTsExtensions`、`moduleDetection: force` 等选项已经包含在实际类型检查中。[Vue tsconfig 官方说明](https://github.com/vuejs/tsconfig)

原 `tsconfig.include` 只包含 `src`，遗漏了根目录的 Vite、Vitest 等工具配置。本次加入 `*.config.ts` 和 `plugins/**/*.ts`，将这些配置、构建插件及新增回归测试纳入正式 `pnpm type-check`，扩大后的范围已通过类型检查。

TypeScript 6 保留一项明确的上游声明例外：`@uni-helper/uni-manifest-types@0.6.0` 的 optional peer 仍为 `typescript: ^5.0.0`，因此不能声称所有已发布 peer 范围都满足。该包自身的 devDependencies 和同版本仓库 catalog 已使用 TypeScript `^6.0.3`；它只提供声明，不调用编译器内部 API。补充验证使用 TS 6.0.3、`strict`、`noEmit` 和 `skipLibCheck: false` 检查完整发布声明，结果无诊断；项目 manifest 配置及全部源码、根配置和插件也通过检查。基于这些证据保留 TS 6，公开记录范围滞后，不通过放宽 peer 规则掩盖它。[上游 0.6.0 包配置](https://github.com/uni-helper/vite-plugin-uni-manifest/blob/v0.6.0/packages/types/package.json)、[同版本 TypeScript catalog](https://github.com/uni-helper/vite-plugin-uni-manifest/blob/v0.6.0/pnpm-workspace.yaml)、[已发布 peer 元数据](https://registry.npmjs.org/@uni-helper%2Funi-manifest-types/0.6.0)

微信类型 v5 改动 Component/Behavior/Page 的返回品牌类型、标识符类型名及属性默认值推导。项目主要使用 uni-app API，未发现直接依赖相关原生泛型的调用；它是声明更新，不是微信基础库运行时升级。carbon 更新后的五个现用图标名称，以及 line-md 的 `chevron-left`，均已通过图标数据核对存在。[微信类型 CHANGELOG](https://github.com/wechat-miniprogram/api-typings/blob/master/CHANGELOG.md)

### 测试环境与 ESLint

Vitest 3 调整了 `mockReset`、重复 `spyOn`、错误对比、fake timers 和测试选项参数位置。原测试主要使用普通 mocks 与 fake timers，重点回归 Tabbar 动画和 composable 生命周期；没有理由为尚未命中的变化添加全局兼容开关。[Vitest 3 迁移指南](https://v3.vitest.dev/guide/migration.html)

Happy DOM 16 重构解析器，19 移除 CommonJS，20 默认禁用页面 JavaScript evaluation。项目由 Vitest 提供 DOM，没有直接依赖 Browser API、页面 eval 或序列化快照，不应为了恢复旧默认而全局启用脚本执行。Vue Test Utils 2.5 删除 class component 支持并调整卸载时 emitted 清理，项目没有相应旧组件写法。[Happy DOM 19](https://github.com/capricorn86/happy-dom/releases/tag/v19.0.0)、[Happy DOM 20](https://github.com/capricorn86/happy-dom/releases/tag/v20.0.0)、[Vue Test Utils 2.5](https://github.com/vuejs/test-utils/releases/tag/v2.5.0)

ESLint 10 移除旧配置和 RuleContext API，并调整推荐规则。项目已用 flat config，升级采用 uni-helper 0.7.5，并显式声明 `@antfu/eslint-config` 9.5.1，确保这组配置依赖与 ESLint 10 对齐。[ESLint 10 迁移](https://eslint.org/docs/latest/use/migrate-to-10.0.0)、[uni-helper ESLint 配置](https://github.com/uni-helper/eslint-config)

实际配置已从 `uniHelper({ rules })` 改为 `uniHelper({}, { rules })`，把项目规则作为后置配置传入。原写法中的规则可能被后续 uni-helper 配置覆盖，文件里写了关闭规则不等于最后生效。本次保持项目已有的单行元素换行偏好，并通过正确配置顺序落实它。

## 本地补丁与回归维护

两项补丁都绑定已核查的精确版本，由 pnpm 的 `patchedDependencies` 应用。补丁保留在仓库，不依赖手工修改 `node_modules`；升级对应包时应先检查上游修复，再决定是否继续维护。

### 小程序多行属性转换

`@unocss-applet/transformer-attributify@0.14.0` 在计算属性片段偏移时只查找普通空格。标签名后直接出现换行或制表符时，后续 MagicString 编辑位置可能偏移，破坏生成 class 或既有属性。

补丁 `patches/@unocss-applet__transformer-attributify@0.14.0.patch` 只把 `dist/index.mjs` 中的 `indexOf(' ')` 改为 `search(/\s/)`，统一处理首个空白字符，不改变属性解析、规则选择或样式配置。

`plugins/vite/attributify.test.ts` 直接调用实际 transformer、UnoCSS generator 和 MagicString，再用 Vue SFC parser 检查转换后的结构。五项回归覆盖 LF、CRLF、制表符、单行空格，以及分组属性与无值属性混用；同时断言 class 完整、`hover-class` 保留且没有重复残留属性。新增 `unocss-applet` 和 `magic-string` 直接开发依赖，是为了明确这些测试的真实导入来源。

移除条件：上游兼容版本已正确处理上述空白分隔，去掉补丁后的五项回归仍通过，且该版本与当前 uni preset / UnoCSS / Vite 的依赖范围一致。不能只因补丁文件无法应用就直接删除。

### unh 构建失败传播

补丁 `patches/@uni-helper__unh@0.3.2.patch` 仅修改 `dist/cli.mjs` 两处控制流：构建子进程结束后检查 `error`、`signal`、`status`；CAC 解析使用 `run: false`，随后 `await cli.runMatchedCommand()`，让异步 action 的异常进入已有顶层错误处理。

成功构建仍执行前置、后置 hook；失败、信号终止或命令不存在时，CLI 返回 1、保留错误原因并跳过后置 hook。显式等待 CAC action 还避免 `--unhandled-rejections=warn` 下仅打印未处理 Promise 警告而错误返回成功。本项目的 test mode 复制 hook 因此只会在成功构建后执行。

`plugins/unh.test.ts` 启动实际 unh CLI，在临时目录提供受控的 `uni` 命令及记录 hook 的配置。五项回归分别覆盖成功、退出码 7、SIGTERM、命令不存在，以及未处理 Promise 仅警告的 Node 模式。测试同时检查退出码、错误文本和 hook 日志；Windows 跳过依赖 POSIX 自终止信号的单项，其余场景继续覆盖。

移除条件：上游新版同时处理子进程失败和异步命令等待，移除补丁后的五项回归仍符合当前契约，再更新精确版本与 pnpm 补丁映射。只修复其中一处不足以移除整个补丁。

## pnpm 10 → 12 配置迁移

pnpm 12.4.1 已正式发布。本次采用官方 10→12 迁移流程，已将 pnpm 设置集中到工作区 YAML。[官方迁移文档](https://github.com/pnpm/pnpm.io/blob/main/docs/migration.md)、[pnpm 12 差异](https://github.com/pnpm/pnpm.io/blob/main/blog/2026-08-10-whats-different-in-pnpm-12.md)、[12.4.1 发布](https://github.com/pnpm/pnpm/releases/tag/v12.4.1)

配置迁移结果如下：

| 原位置或写法 | 已落实的配置 |
| --- | --- |
| `package.json.packageManager` | 已固定为 `pnpm@12.4.1` |
| `package.json.pnpm.onlyBuiltDependencies` | 已改为 `pnpm-workspace.yaml` 的 `allowBuilds` 映射 |
| `package.json.pnpm.patchedDependencies` | 已迁入工作区 YAML，保留两项精确版本补丁 |
| `.npmrc` 的 `auto-install-peers` | 已迁为 `autoInstallPeers: true` |
| `.npmrc` 的 `shamefully-hoist` | 已迁为 `shamefullyHoist: true` |
| `.npmrc` 的 `strict-peer-dependencies` | 已迁为 `strictPeerDependencies: false`，TS6 声明例外仍公开记录 |
| 三份 `unconfig: 7.3.2` 覆盖 | 已移除失效覆盖 |
| registry | 保留原项目 registry，`.npmrc` 仅维护该项 |
| `.nvmrc` | 已精确固定为 `22.22.2`，避免 CI 命中较旧的 22.x 缓存 |

构建许可沿用原明确白名单，并按实际安装图新增 `@parcel/watcher: true` 和 `core-js-pure: false`。工作区还明确设置 `shellEmulator: true`、`trustPolicy: no-downgrade` 和 `minimumReleaseAgeExcludePrune: true`，落实新工具配置规则；没有用通配符允许全部构建脚本。[pnpm 11 默认值变化](https://github.com/pnpm/pnpm.io/blob/main/blog/releases/11.0.md)

### 发布等待期与锁文件重解析

本次保留 pnpm 12 默认的 `minimumReleaseAge: 1440` 分钟。首次迁移时，旧 pnpm 10 锁文件包含 12 项尚未满足该时限的发布：Babel 8.0.5 系列、uni-types 1.3.0 及三个配套类型包、baseline-browser-mapping 2.11.22、electron-to-chromium 1.5.427、micromark-extension-gfm-table 2.1.2、nanoid 3.3.19 和 update-browserslist-db 1.3.3。旧锁文件已记录这些版本，并不代表它们满足新安装器的发布等待规则。

重新解析时，pnpm 曾自动为 uni-types 系列四包和 update-browserslist-db 添加五项 `minimumReleaseAgeExclude`，导致声明 `^1.1.0` 仍选入 1.3.0。本次已删除这些自动豁免，并明确设置 `minimumReleaseAgeStrict: true`，按默认等待时限重新解析锁文件；没有通过降低时限解决安装拒绝。

uni-types 的目标因而改为 1.1.0，声明范围为 `^1.1.0`；最终锁文件已解析为 1.1.0，三个配套类型包及对应 peers 也统一为 1.1.0。调查时 latest 1.3.0 的发布时间为 `2026-09-11T03:31Z`，在这次解析发生时尚未满 24 小时。这是发布等待期内的版本选择，并非发现 1.3.0 本身不能运行；后续更新可在满足等待时限后重新评估。最终安装保留 1440 分钟严格等待期，没有任何 `minimumReleaseAgeExclude`。[uni-types 发布元数据](https://registry.npmjs.org/@uni-helper%2Funi-types)、[pnpm 迁移文档](https://github.com/pnpm/pnpm.io/blob/main/docs/migration.md)

`trustPolicy: no-downgrade` 另命中了 DCloud 精确依赖的 `@vitejs/plugin-legacy@5.3.2`。该版本发布于 `2024-03-08T12:40:20.991Z`，发布者为 vitebot，发布元数据没有 provenance，而更早的稳定版 4.0.4 已有该证明，因此符合 pnpm 按发布时间判定的信任降级规则；npm 官方与镜像的时间、完整性和证明信息一致，本次解析的 SHA512 也与原锁文件相同。为兼容这一历史发布，工作区使用官方 `trustPolicyIgnoreAfter: 525600` 分钟设置，将信任降级检查保留在最近一年发布的包上。

这是策略范围的明确取舍：一年以前发布的包不再接受该项信任降级检查，不能把安装通过表述为所有包的完整信任检查都通过。它也没有改变此前记录的 uni-manifest-types / TS6 optional peer 例外。[pnpm trustPolicyIgnoreAfter 说明](https://github.com/pnpm/pnpm.io/blob/main/versioned_docs/version-10.x/settings.md#trustpolicyignoreafter)

### 本机引导与 CI 配套

首次由旧 pnpm 10 自动引导 pnpm 12 时，本机精确版本缓存出现 `ENOEXEC`。针对该版本缓存执行官方 `install.js` 后，pnpm 12.4.1 已能启动；这属于本机引导修复，没有修改项目构建逻辑。另已验证通过 `npm exec` 启动精确 pnpm 12.4.1 的方式，可用于旧 pnpm 引导失败的环境。

CI 的 `pnpm/action-setup@v4` 不支持新的 pnpm 12 安装流程，工作流已升级为 `v6.1.0`，该发布明确加入 pnpm 12 支持。Node 仍从精确 `.nvmrc` 读取；本机命令启动成功和实际 CI 成功分开记录。[action-setup 6.1.0 发布说明](https://github.com/pnpm/action-setup/releases/tag/v6.1.0)

## 平台发行注意事项

DCloud 发行日志同时包含 uni-app 与 uni-app x，UTS、uvue 和蒸汽模式说明不能直接套用到当前 Vue 3 uni-app。日志中的 UnoCSS app.wxss、分包依赖修复与当前构建更相关。5.14 默认开启统计公有版，本次保留项目显式的 `uniStatistics.enable: false`，生成 manifest 一并纳入回归核对。[uni-app 发行日志](https://uniapp.dcloud.net.cn/release)

原生云打包的 Xcode、iOS SDK、最低 iOS 和 Android compileSdk 也随发行线变更。H5/微信构建无法验证原生基座、权限、真机手势或云打包；实际发布原生应用时需与所选正式版基座配套验证。[App 打包环境](https://uniapp.dcloud.net.cn/tutorial/app-env.html)

## 未升级项的明确理由

| 原因 | 依赖 |
| --- | --- |
| 已是调查时 latest | plugin-uni 0.1.0、uni-layouts 0.1.11、bundle-optimizer 2.2.0、z-paging 2.8.8、Alipay 类型 3.0.14、line-md 1.2.16 |
| DCloud 正式编译器配套约束 | Vue/runtime-core 3.4.21、Vite 5.2.8、plugin-vue 5.2.4 |
| inspector 宿主与 uni 预设全链约束 | UnoCSS 精确 66.8.1、uni preset 精确 0.4.0；不采用引入 Vite 7/8 集成的最新组合 |
| pnpm 默认发布等待期 | uni-types 暂选 1.1.0；1.3.0 在本次解析时尚未发布满 24 小时 |
| Vue peer 约束 | Pinia 2.2.4；persistedstate 精确对齐 4.1.3 |
| 支持范围内更新，暂不跨越主版本 | Vitest 3.2.7、TypeScript 6.0.3、vue-i18n 9.14.5、Sass 1.104.0 |

这组保留项不是遗漏。后续需要跨过 Vue/Vite 上限时，应重新评估 DCloud 发布线及全部 uni-app 插件，而不能只放宽 peer 检查。

## 已知漏洞审计与定向修复

使用同一 npm 官方审计数据库分别扫描原始 `82b45f5` 锁文件和最终锁文件，基线审计只读取临时目录中的原文件，没有安装旧依赖。结果如下：

| 严重程度 | 升级前 | 升级后 |
| --- | --- | --- |
| Critical | 25 | 0 |
| High | 78 | 11 |
| Moderate | 58 | 24 |
| Low | 11 | 9 |
| 合计 | 172 | 44 |

命令为 `pnpm audit --json --registry=https://registry.npmjs.org`，最终退出码为 1，表示仍有已知漏洞。按包名和 GHSA 对照，最终没有新增的漏洞组合；计数会受同一公告在不同版本上的重复命中影响，也不等于生产应用存在相同数量的可利用入口。完整公告列表、已安装版本、修复范围及直接上游已整理为[精简审计快照](dependency-audit-2026-09-12.json)，其中只折叠重复传递路径。

最后一项 Critical 来自 `uni-layouts → c12 → giget 1.2.5 → tar 6.2.1`。它还包含多个路径处理与资源耗尽公告。项目并未使用远程模板解包，uni-layouts 0.1.11 的发布代码也未实际导入其声明的 c12；这不是已确认的业务攻击路径。不过旧 tar 仍在依赖树中，本次通过精确 `giget@1.2.5>tar: 7.5.22` 覆盖修复了该分支的全部 12 项公告。[tar 资源耗尽公告](https://github.com/advisories/GHSA-23hp-3jrh-7fpw)、[后续路径处理公告](https://github.com/advisories/GHSA-r292-9mhp-454m)

这是经过验证的跨主版本覆盖：tar 7 要求 Node 18 及以上，当前 Node 满足；giget 使用的命名 `extract` 导出、Promise 完成契约和 `onentry` 路径处理仍可用。`plugins/layout-archive.test.ts` 沿 layouts 的真实依赖链加载 giget，在独立临时缓存中创建并离线提取小归档，验证仓库根目录剥离及子目录选择，两项均通过。升级 layouts/c12/giget 后，若其正常依赖已使用安全 tar，且这两项测试通过，即可移除该定向覆盖。

剩余 11 项 High 涉及 Vite、DCloud 固定的 PostCSS、ws、adm-zip、Intlify，以及 Express 的 path-to-regexp 和 Jimp 的 jpeg-js。它们的公开修复版本超出当前上游声明或精确版本，需要分别适配编译器内部用法，不能通过普通更新就消除。本次保留正式编译链，明确记录这些风险；仅升级项目根依赖不能代表 DCloud 内置依赖已同步修复。开发服务仍应仅用于可信本机环境，不能把这组结果当作可公开暴露开发服务的依据。

Vitest / `@vitest/mocker` 3.2.7 另命中中危 GHSA-82fw-gwwq-j7x9，修复版本从 4.1.11 起。公告针对直接使用 `mockerPlugin` / `interceptorPlugin` 暴露的未鉴权 HMR 接口；本项目执行 `vitest run`，使用 Happy DOM，未配置这两个服务插件。当前测试方式不符合公告暴露条件，但依赖审计仍保留该命中，未以此声称漏洞不存在。[Vitest 官方公告](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9)

## 验证结果

最终验证环境为 macOS arm64、Node.js 22.22.2、pnpm 12.4.1。所有命令均在分支 `codex/dependency-upgrades` 的最终依赖树下执行，两个补丁由 pnpm 自动应用。

| 检查 | 结果 |
| --- | --- |
| 全新安装、`pnpm install --frozen-lockfile` | 通过；严格 24 小时发布等待期，无年龄豁免 |
| `pnpm test` | 8 个测试文件、45 项测试全部通过；基线为 30 项 |
| `pnpm type-check` | 通过，包含源码、根目录工具配置和 `plugins` |
| `pnpm lint` | 通过，包含新工作区 YAML 与回归测试 |
| `pnpm build:test` | 通过，构建成功后执行复制 hook |
| `diff -qr dist/build/h5 dist/test/h5` | 通过，test mode 复制产物完全一致；在下一次生产构建前检查 |
| `pnpm build` | H5 生产构建通过 |
| `pnpm build mp-weixin` | 微信小程序构建通过 |
| `pnpm build mp-alipay` | 支付宝小程序构建通过 |
| `pnpm build app` | App 编译产物构建通过 |
| `pnpm dev` | 开发服务成功启动；浏览器首页加载正常 |
| H5 生产产物浏览器冒烟 | 首页 → Demo → 带参数页面、计数器修改及刷新持久化通过；最终产物重载后状态保持，控制台没有警告或错误 |
| 路由与 manifest 核对 | 微信/支付宝均有 2 个主包页面、2 个分包共 3 个页面，无重复路径，tabBar 两项正确；统计开关仍为 `false` |
| 归档提取兼容 | tar 7.5.22 覆盖后的真实 giget 根目录和子目录提取均通过 |
| 已知漏洞审计 | 172 项降至 44 项，Critical 25 → 0；仍有 11 项 High，详情见前文 |
| 独立只读复审 | 应用入口、自动导入、两项补丁及测试、pnpm 与 CI 配置未发现待修正问题 |

新增 15 项测试分别验证真实 store 的持久化契约（3 项）、小程序属性转换（5 项）、unh CLI 成败传播（5 项）和归档提取兼容（2 项）。它们直接覆盖本次发现的问题，不以安装成功或静态类型替代行为验证。两个上游补丁都先通过无补丁失败、应用补丁后通过的对照验证。

仍存在以下明确边界：

- `pnpm peers check` 仍报告 uni-manifest-types 0.6.0 的 TS5 optional peer；实际 TS6 声明及项目检查通过，原因和证据见前文。
- 构建及组件测试仍显示 Sass legacy JS API 弃用提示，这是固定 Vite 5.2.8 的调用方式；没有隐藏提示，Sass 2 不在当前可升级范围。
- Vue I18n 9 已结束维护，DCloud 平台内置 9.1.9 的限制也未由根依赖升级消除。
- `trustPolicyIgnoreAfter` 只对最近一年发布版本执行信任降级检查；完整性校验、发布等待期和构建脚本许可仍独立生效。
- 本次没有执行远端 GitHub Actions、云打包、原生基座/真机运行及其他小程序平台运行。App 构建成功不等于原生发行验证；图表和国际化暂未接入业务实例，未声称覆盖其交互。

构建导致的 `pages.json` 平台生成标记变化已核对为注释差异并恢复；本次验证启动的开发服务、静态服务和浏览器页均已关闭。

## 提交记录

升级按依赖拆分提交。DCloud 同批次 20 个包作为不可拆开的编译兼容单元；ESLint 配置组、UnoCSS 预设及其必要补丁按配套关系提交。后续发现的接入修正另作小提交，便于独立审查。

下表列出文档提交前的 34 个实施提交。uni-types 曾验证 1.3.0，最终在 pnpm 迁移提交中按发布等待期调整到 1.1.0；以版本矩阵和最终锁文件为准。

| Commit | 变更 |
| --- | --- |
| `5d752af` | chore(deps): 升级 uni-app 至 5.24 稳定编译链 |
| `24c7362` | chore(deps): 升级 Vitest 至兼容 Vite 5 的 3.2.7 |
| `1f40dcc` | chore(deps): 升级 happy-dom 至 20.14.3 |
| `595c3cd` | chore(deps): 升级 Vue Test Utils 至 2.5.0 |
| `f6e156f` | chore(deps): 升级 uni-pages 至 0.5 并迁移类型入口 |
| `b7ef0be` | fix(deps): 对齐 Pinia 2 持久化插件并验证存储契约 |
| `b7cfc84` | fix(pinia): 按 uni-app 契约返回 Pinia 模块 |
| `d65a229` | chore(deps): 升级 unh 并移除过期 unconfig 覆盖 |
| `dae82a4` | chore(deps): 升级 uni-manifest 至 0.6.0 |
| `bff2be3` | chore(deps): 升级 uni-components 并限定全局类型生成 |
| `fd139d3` | chore(deps): 升级 uni-platform 至 0.1.2 |
| `1ca04a2` | chore(deps): 升级 uni-ku root 并修正非浏览器环境判断 |
| `aa468f5` | chore(deps): 升级 unplugin-auto-import 至 21.1.0 |
| `2469070` | chore(deps): 升级 vue-tsc 至 3.3.11 |
| `482238b` | chore(deps): 升级 TypeScript 至 6.0.3 并移除 baseUrl |
| `83fa923` | fix(auto-import): 排除 Vue 3.4 不支持的 API 并清理旧声明 |
| `9f52531` | chore(deps): 升级 uni-types 至 1.3.0 稳定版 |
| `e558081` | chore(deps): 升级并实际继承 Vue TypeScript 基础配置 |
| `38c4e7e` | chore(deps): 将 Node 类型对齐项目 Node 22 运行环境 |
| `6da02a5` | chore(deps): 升级微信小程序 API 类型至 5.2.3 |
| `74befec` | chore(types): 将构建配置与插件纳入类型检查 |
| `ab094bd` | chore(deps): 升级 ESLint 10 及兼容配置组 |
| `72e32ed` | chore(deps): 升级 UnoCSS 至兼容编译链的 66.8.1 |
| `324be99` | chore(deps): 升级 uni UnoCSS 预设并修复多行属性转换 |
| `666a6ec` | fix(unh): 传播构建失败并等待异步命令异常 |
| `c393213` | chore(deps): 升级 ECharts 至 6.1.0 |
| `d905286` | chore(deps): 升级 uni-echarts 并移除重复预构建配置 |
| `b1560e9` | chore(deps): 升级 Vue I18n 至兼容主版本 9.14.5 |
| `918d7f1` | chore(deps): 升级 Sass 至 1.104.0 |
| `cfbd542` | chore(deps): 升级 Carbon 图标数据至 1.2.27 |
| `ebe613a` | chore(deps): 限定 TypeScript 为已支持的 6.0 系列 |
| `2f08379` | ci(deps): 升级 pnpm 安装 action 以支持 12 系列 |
| `9880c7b` | chore(deps): 升级 pnpm 至 12.4.1 并迁移安装策略 |
| `9ce0c66` | fix(deps): 修复布局插件传递依赖 tar 的已知漏洞 |
