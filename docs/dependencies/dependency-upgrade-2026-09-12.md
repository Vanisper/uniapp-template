# 2026-09-12 依赖升级调查

本次以 uni-app 正式版工具链的兼容约束为基础，调查全部直接依赖和包管理器。升级目标既包括版本更新，也包括修正已存在的依赖搭配和接入偏移。不能用一次 `update --latest` 代替这些判断。

原版本取自 `main` 的 `82b45f58f01d57f6b873a35625dd03cf142af0f9`，调查时间为 2026-09-11 至 2026-09-12。版本依据包括 npm 元数据、官方模板、发布日志及对应版本的源码、类型声明。首轮核查了原有 58 项直接依赖，随后对照 create-uni 的实际生成模板复核，并按授权修正 TypeScript、UnoCSS 与测试工具链方案。

最终采用 TypeScript 5.9.3、UnoCSS 66.10.1 / uni preset 0.5.1 / applet 0.15.1，以及独立测试工作区中的 Vitest 4.1.11 / Vite 6.4.3。应用保持 DCloud 配套的 Vite 5.2.8。业务、Node 与测试配置分别维护并统一检查；版本、接入、行为验证及剩余边界如下。

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
| `@uni-helper/unocss-preset-uni` | `^0.2.11` | `0.5.1`，精确锁定 | 对齐 create-uni 新预设组合，开发 Inspector 已实测 |
| `@uni-helper/vite-plugin-uni-components` | `^0.2.6` | `0.3.2` | 更新组件扫描与解析器，修复导入变量命名 |
| `@uni-helper/vite-plugin-uni-layouts` | `^0.1.11` | `0.1.11` | 保持，已是 latest |
| `@uni-helper/vite-plugin-uni-manifest` | `^0.2.12` | `0.6.0` | 更新配置类型及生成生命周期，适配 ESM 入口 |
| `@uni-helper/vite-plugin-uni-pages` | `^0.3.22` | `0.5.0` | 更新路由生成、平台合并，迁移类型入口 |
| `@uni-helper/vite-plugin-uni-platform` | `^0.0.5` | `0.1.2` | 修复平台文件路径解析 |
| `@uni-ku/bundle-optimizer` | `^2.2.0` | `2.2.0` | 保持，已是 latest |
| `@uni-ku/root` | `^1.4.1` | `1.5.0` | 新增 nvue 支持，修复分包字段及路径匹配 |
| `unocss` | `66.0.0` | `66.10.1`，精确锁定 | 新 Inspector 在实际 Vite 5 上通过协议、HMR 与重启验证；66.10.2 尚未满足本项目发布等待期 |
| `unplugin-auto-import` | `^19.1.0` | `21.1.0` | 适配 ESM-only，排除 Vue 3.4 不提供的 API 并覆盖生成声明 |
| `echarts` | `^6.0.0` | `6.1.0` | 更新图表修复，核查 minor 中的破坏性变化 |
| `uni-echarts` | `^2.4.1` | `2.5.3` | 更新手势兼容及 Vite 自动配置 |
| `z-paging` | `^2.8.8` | `2.8.8` | 保持，已是 latest |

### 测试、类型、静态检查与包管理器

| 依赖或工具 | 原声明 | 目标版本 | 决策与理由 |
| --- | --- | --- | --- |
| `vitest` | `^2.1.9` | `4.1.11`，测试工作区 | 从停止维护的 3.x 迁出，使用包含公告修复的 4.x；10 个文件、49 项测试通过 |
| 测试专用 `vite` | 原来与应用共用 `5.2.8` | `6.4.3`，测试工作区 | 与 Vitest 4 实际隔离安装；应用构建仍使用 5.2.8 |
| `happy-dom` | `^15.11.7` | `20.14.3`，测试工作区 | 保留现有 DOM 测试目的，不改用真实小程序自动化环境 |
| `@vue/test-utils` | `^2.4.11` | `2.5.0` | 更新 Vue 测试工具，核查组件卸载行为 |
| `typescript` | `^5.9.3` | `5.9.3`，精确锁定 | 对齐实际生成模板，消除 manifest-types 的 TS5 peer 例外；没有已识别的 TS6 功能需求 |
| `vue-tsc` | `^3.2.1` | `3.3.11` | 与 create-uni 模板一致，配合 TS 5.9.3 |
| `@vue/tsconfig` | `^0.8.1` | `0.9.1` | 业务配置实际继承 DOM 基础配置，工具和测试分别检查 |
| `@types/node` | `^25.0.3` | `22.20.2` | 对齐实际验证的 Node 22 运行环境 |
| `eslint` | `^9.39.2` | `10.10.0` | 与新 uni-helper ESLint 配置配套 |
| `@uni-helper/eslint-config` | `^0.6.1` | `0.7.5` | 新版 peer 要求 ESLint 10 |
| `@antfu/eslint-config` | 新增直接依赖 | `9.5.1`，精确锁定 | 显式匹配 uni-helper 配置及 ESLint 10 |
| `unocss-applet` | 新增直接依赖 | `0.15.1`，精确锁定 | 与新预设配套，已包含多行属性修复，移除旧本地补丁后五项回归通过 |
| `magic-string` | 新增直接依赖 | `1.2.2`，精确锁定 | 属性转换回归直接使用源码编辑 API |
| `miniprogram-api-typings` | `^4.1.2` | `5.2.3` | 更新微信 API 类型，核查原生构造器类型变化 |
| `@mini-types/alipay` | `^3.0.14` | `3.0.14` | 保持，已是 latest |
| `@iconify-json/carbon` | `^1.2.15` | `1.2.27` | 更新图标数据，现用图标名称仍存在 |
| `@iconify-json/line-md` | `^1.2.16` | `1.2.16` | 保持，已是 latest |
| pnpm | `10.32.1` | `12.4.1` | 更新包管理器，迁移工作区配置与构建许可 |
| `pnpm/action-setup`（CI） | `v4` | `v6.1.0` | 配套 pnpm 12 的安装引导 |

## create-uni 生成模板复核

对照基准是 create-uni 2.15.1、仓库提交 `30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca`。npm 发布包中的 117 个模板文件与该提交逐字节一致。检查对象是 `packages/core/template` 及其生成逻辑；根 monorepo 的 TypeScript 6、Vitest 5 和 pnpm 12 开发依赖不会自动进入应用产物。自定义项目依次合并 base、配置、插件、模块与 UI；命名模板则下载其他仓库，不能混为一套配置。[模板发布范围](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/package.json#L30-L33)、[生成流程](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/src/index.ts#L136-L187)

| 对照项 | create-uni 实际产物 | 本项目决策 |
| --- | --- | --- |
| DCloud / Vue / Vite / Pinia | 5.24 批次 / 3.4.21 / 5.2.8 / 2.2.4 | 已对齐，保留正式编译链和 Pinia namespace 返回契约 |
| TypeScript | 5.9.3 | 已从首轮 TS6 改为精确 5.9.3；保留正确 paths、实际 extends 和配置覆盖 |
| UnoCSS 组合 | Uno `~66.10.1`、preset `^0.5.1`、applet `^0.15.1` | 已采用 66.10.1 / 0.5.1 / 0.15.1，实测后移除已被上游修复的补丁 |
| 测试模块 | Vitest 4.1.10、真实小程序自动化环境 | 采用已修复公告的 4.1.11；保留本项目 DOM/Node 测试，在独立工作区使用 Vite 6.4.3 |
| i18n / Sass / DCloud types | 9.6.2 / 1.64.2 / `^3.4.8` | 保留我们的 9.14.5 / 1.104.0 / 精确 3.4.31；wot2 模块本身也会把 Sass 覆盖成 1.104.0 |
| 持久化、unh 补丁、tar 定向覆盖 | 没有对应接入或修复 | 保留本项目已有能力及经复现验证的修复，不能由最小模板的缺省推导为不需要 |
| Node 与 pnpm 策略 | 产物没有固定 Node/pnpm；构建脚本全部放行 | 保留已验证的 Node 22.22.2、pnpm 12.4.1 与逐包 allowBuilds；不是模板强制要求 |

版本来源：[base](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/template/base/package.json#L11-L46)、[Pinia](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/template/module/pinia/package.json)、[TypeScript](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/template/config/typescript/package.json)、[UnoCSS](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/template/module/unocss/package.json)、[Vitest](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/template/module/vitest/package.json)、[wot2 Sass](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/template/UI/wot2/package.json)。

保留项目的分包目录、pages `/client` 类型入口、`InternalPageItem` 迁移、组件声明位置与 namespace、Vue 3.4 自动导入过滤、unh 预生成及 test mode 复制。模板中的 `includes` 拼写、未实际继承的 tsconfig 包，以及 `window?.open` 都不应照搬。脚手架 CI 的生成和构建矩阵，也不等于生成项目的全部类型、测试和开发 Inspector 已经验证。[模板 TS 配置](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/template/config/typescript/jsconfig.json#L18)、[模板 App.ku.vue](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/template/plugin/root/src/App.ku.vue#L1-L12)、[生成组合 CI](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/.github/workflows/core_test.yml#L61-L128)

## 决定升级上限的兼容关系

### DCloud 正式批次优先于 dist-tag

调查时，多数 DCloud 包的 `latest` 指向 Vue 2 系列，`vite-plugin-uni` 的 `latest` 仍是旧 alpha，`vue3` 则指向另一条使用 Vite 8 的实验发布线。标签名称不能单独证明它是当前项目需要的 Vue 3 正式版。因此本次以官方模板和正式发布版本交叉核对，选定 `3.0.0-5020420260813003`。

该正式批次仍使用 Vue 3.4.21、Vite 5.2.8 和 plugin-vue 5.2.4。uni-helper 的 pages、components、manifest、platform 与 uni-ku/root 最新版也仍声明 Vite 5，bundle-optimizer 声明 Vite 4/5。独立把根 Vite 升到 8 或 Vue 升到 3.5，会让运行时、编译器和插件超出已声明的配套关系。[DCloud 官方模板](https://github.com/dcloudio/uni-preset-vue/blob/vite-ts/package.json)、[正式版编译共享包](https://registry.npmjs.org/@dcloudio%2Funi-cli-shared/3.0.0-5020420260813003)

Pinia 2.2.5 起要求 Vue `^3.5.11`，所以保留 2.2.4。persistedstate 4.2 要求 Pinia `>=2.3.0`，4.3 起要求 `>=3.0.0`；原来的 4.7.1 搭配 Pinia 2.2.4 已经偏离支持范围。修正到精确 4.1.3 后，不能再使用 `^4.1.3`，否则后续更新锁文件仍可选入不兼容的 4.x。[Pinia 2.2.5 peer](https://registry.npmjs.org/pinia/2.2.5)、[persistedstate 4.1.3 元数据](https://registry.npmjs.org/pinia-plugin-persistedstate/4.1.3)、[persistedstate 变更记录](https://github.com/prazdevs/pinia-plugin-persistedstate/blob/main/CHANGELOG.md)

### 应用编译与测试工具链分开约束

首轮将测试与应用共用一个 Vite，因而停在 Vitest 3.2.7。这是当时的安装布局选择，不是 DCloud 要求所有测试都只能使用 Vite 5。官方安全公告明确说明 Vitest 2/3 已停止维护且不计划回补此次修复，原报告“维护中的 3.x”表述有误。[Vitest 官方公告](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9)

当前已将测试运行器放入 `tools/testing` 工作区，安装 Vitest 4.1.11 与 Vite 6.4.3，应用根仍固定 Vite 5.2.8。两条链有各自实际解析的 Vite，不能仅用包别名或口头称为隔离。测试迁移继续保留 Vue 3.4.21、Vue Test Utils、Happy DOM 和真实 CLI 回归；45 项测试、分开的类型检查及五种构建已经通过，ESLint 的旧 Vitest 路径也已清除，最终审计不再命中 Vitest 公告。[Vitest 4 迁移](https://v4.vitest.dev/guide/migration)、[Vitest 4.1.11 元数据](https://registry.npmjs.org/vitest/4.1.11)

TypeScript 6 曾通过本项目检查，但并没有必须升级到 6 的业务或 Vue 工具需求。复核后采用模板的精确 5.9.3，满足 uni-manifest-types 0.6.0 已发布的 TS5 optional peer；这项修正消除声明例外，不代表发现 TS6 的实际运行故障。vue-tsc 3.3.11 保留。TypeScript 7 的原生编译器 API 迁移与本次选择 5.9.3 是不同问题，不能用它证明 6.0.3 是唯一目标。[模板 TypeScript](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/template/config/typescript/package.json)、[manifest-types 已发布 peer](https://registry.npmjs.org/@uni-helper%2Funi-manifest-types/0.6.0)

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
- 业务与测试 tsconfig 的类型入口改为 `@uni-helper/vite-plugin-uni-pages/client`，以加载 `definePage` 全局和虚拟模块声明

`UserPagesConfig` 仍以兼容类型导出，无需将它视为删除 API。0.5 同时修正 `softinputMode` / `softinputNavBar` 拼写，并把只对页面有效的 `disableScroll` / `disableSwipeBack` 移出全局样式类型；当前配置未使用这些旧字段。[uni-pages 0.5 README](https://github.com/uni-helper/vite-plugin-uni-pages/blob/v0.5.0/packages/core/README.md)、[类型定义](https://github.com/uni-helper/vite-plugin-uni-pages/blob/v0.5.0/packages/core/src/types.ts)

路由扫描从 fast-glob 转向 tinyglobby，0.5 还引入生成标记、平台条件合并和过期分包清理。回归范围包含 H5 与微信构建后的首页、tabBar、分包 root 和重复页面，具体结果见文末。已有 `_*.*` 排除模式也不应被理解为任意层级的下划线文件规则；新增这类页面时需按实际扫描范围处理。

unh 0.3.2 的 `autoGenerate.pages` 只在文件缺失时创建占位配置。项目在创建 Vite 插件前调用 uni-pages 的 `generateAll()`，再将同一份扫描配置交给 `UniPages()`：根组件与分包优化插件在创建时即可读取完整路由，后续页面变化由路由插件监听处理。

### CLI hook、配置加载与自动导入

unh 0.2.11 修复 `onBuildAfter` 在构建结束前执行的问题。本项目用它把 H5 test mode 产物复制到 `dist/test/h5`，因此这项升级有直接行为价值。但 0.3.2 仍忽略构建子进程的失败结果，可能返回退出码 0 并执行后置 hook；命令分发还缺少对异步 action 的等待。本次精确固定 0.3.2 并加入补丁，确保失败会以非零退出且跳过复制，具体范围与回归见下方补丁说明。[unh 0.2.11](https://github.com/uni-helper/unh/releases/tag/v0.2.11)、[unh 0.3.2](https://github.com/uni-helper/unh/releases/tag/v0.3.2)

新 unh 和 uni-pages 都要求 `unconfig ^7.5.0`，原来三处强制 `7.3.2` 的覆盖会把已升级工具拉回上游范围外。本次已移除失效覆盖，配置加载由上游依赖范围解析，真实 CLI 的加载行为纳入回归。

manifest 0.5 及 auto-import 21 转为 ESM-only；auto-import 21 最低 Node 为 20.19。本次保留项目已有的 ESM 导入和扫描目录，auto-import 20 的 Nuxt 4 变更不适用于当前非 Nuxt 项目。[manifest 0.5 发布](https://github.com/uni-helper/vite-plugin-uni-manifest/releases/tag/v0.5.0)、[auto-import 21 发布](https://github.com/unplugin/unplugin-auto-import/releases/tag/v21.0.0)

auto-import 的 Vue preset 已包含当前 Vue 3.4.21 不提供的 `getCurrentWatcher`、`onWatcherCleanup`、`useId` 和 `useTemplateRef`。生成这些全局声明会让编辑器错误地暗示项目具备新版 API，因此显式通过 `ignore` 排除四项。实测还发现默认 `dtsMode: 'append'` 会保留已禁用的旧声明，所以同时设为 `'overwrite'`，让声明文件反映当前导入集合。不能只升级插件和生成类型，却把 Vue 运行时仍受 DCloud 约束这一点遗漏。[auto-import 配置说明](https://github.com/unplugin/unplugin-auto-import#configuration)

components 0.3 同步了上游组件扫描实现；现有 `directoryAsNamespace`、声明文件路径和两个 resolver 仍符合接口。0.3.2 会根据安装的 vue-router 和 plugin-vue-jsx，自动生成 `RouterLink` / `RouterView` 和 TSX 全局声明。DCloud H5 运行时的 `initRouter()` 实际调用 `app.use(router)`，不能笼统说项目从未提供路由组件。这里保留 `types: []` 和 `dtsTsx: false`，是显式选择本项目的跨平台类型边界，避免将 H5 能力承诺给 App/小程序，也避免仅因传递依赖存在就生成全项目 TSX 声明。[components 0.3](https://github.com/uni-helper/vite-plugin-uni-components/releases/tag/v0.3.0)、[components 0.3.2](https://github.com/uni-helper/vite-plugin-uni-components/releases/tag/v0.3.2)、[DCloud H5 5.24 发布源码](https://registry.npmjs.org/@dcloudio/uni-h5/-/uni-h5-3.0.0-5020420260813003.tgz)

root 1.5 新增 nvue、支持小写分包字段并修复路径括号匹配，本次保留 `App.ku.vue` / `ku-root-view` 接入。[root 1.5](https://github.com/uni-ku/root/releases/tag/v1.5.0)

### UnoCSS 与样式兼容

新 uni 预设默认使用 Wind3，没有自动切换到 Wind4。本项目大量使用 attributify、`hover-class` 和 `--at-apply`，保留 `presetUni()`、directives 与 variant-group transformer；平台单位转换和小程序颜色语法回退仍由预设处理。当前组合精确固定为 UnoCSS 66.10.1、uni preset 0.5.1 和 applet 0.15.1，满足预设和 applet 的 `~66.10.1` 配套范围。66.10.2 在此次安装时发布不足 24 小时，本项目没有为它增加年龄豁免；选 66.10.1 是当前安装策略的结果，不是发现 66.10.2 不兼容。[模板 Uno 配置](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/template/module/unocss/uno.config.js.ejs#L14-L33)、[预设 0.5.1 元数据](https://registry.npmjs.org/@uni-helper%2Funocss-preset-uni/0.5.1)、[applet 0.15.1 元数据](https://registry.npmjs.org/unocss-applet/0.15.1)

首轮把 66.8.1 视为上限，依据是新版 Inspector 引入的 `@devframes/vite` 只声明 Vite 7/8 peer。复核发现，当前 0.9.18 将该 peer 标为 optional，活跃的 `/single` 入口仅对 Vite 作类型导入，实际需要的 server 接口是 `middlewares.use` 和 `httpServer.once`。没有发现 `server.environments` 等 Vite 6+ 专属 API。Inspector 的事件插件也使用普通 middleware 与 `handleHotUpdate`；DevTools 创建器只是提供可选宿主消费的插件字段。静态 import 和 peer 范围差距都不能单独证明新版本必然运行失败。[optional peer](https://github.com/devframes/devframe/blob/74056280cae0c5ac78f803be3601debd4d9a6278/packages/vite/package.json#L39-L54)、[server 接口](https://github.com/devframes/devframe/blob/74056280cae0c5ac78f803be3601debd4d9a6278/packages/vite/src/single.ts#L1-L38)、[SPA](https://github.com/devframes/devframe/blob/74056280cae0c5ac78f803be3601debd4d9a6278/packages/vite/src/single.ts#L63-L79)、[RPC bridge](https://github.com/devframes/devframe/blob/74056280cae0c5ac78f803be3601debd4d9a6278/packages/vite/src/single.ts#L156-L218)、[DevTools 创建器](https://github.com/vitejs/devtools/blob/f5abefb19055d087b086273491d64837e26aa384/packages/kit/src/node/create-plugin-from-devframe.ts#L45-L64)

本轮在实际 Vite 5.2.8 开发服务上完成验证：`/__unocss/` SPA 与脚本资源可用，通过官方 devframe 客户端从连接元数据发现 WebSocket，完成认证并调用真实项目、模块信息和 CSS 生成 RPC；首页宽度从 137px 改为 139px 后，模块 CSS、服务返回的 Uno 虚拟样式和浏览器计算样式同步变化，收到 Inspector revision 广播与 Vite HMR update；恢复源码后，再确认旧连接随服务停止而断开，重启后的 RPC/HMR 连接重新建立。

后续在未授权 Chrome 中发现首次授权流程遗漏：页面要求输入验证码，终端却没有输出。上述协议脚本主动调用了 `requestAuthCode()`，替页面触发了打印，因此不能用那次验证证明首次访问正常。UnoCSS 66.10.1 的预编译页面禁用了 `simpleAuth`，只发起旧握手和验证码交换；devframe 0.9.18 则改为收到单独的 `request-code` 请求后才打印。66.10.2 的客户端仍有同样问题，升级该补丁版本不能解决。[Inspector 连接配置](https://github.com/unocss/unocss/blob/v66.10.1/packages-integrations/inspector/client/composables/rpc.ts#L32-L37)、[授权界面](https://github.com/unocss/unocss/blob/v66.10.1/packages-integrations/inspector/client/components/AuthGate.vue#L54-L79)、[devframe 请求与打印逻辑](https://github.com/devframes/devframe/blob/74056280cae0c5ac78f803be3601debd4d9a6278/packages/devframe/src/recipes/interactive-auth.ts#L167-L239)

`patches/devframe@0.9.18.patch` 为旧客户端补充兼容：未授权握手或验证码交换失败时，调用现有 `printBanner()`。授权结果、敏感 RPC 门禁、可信设备存储、验证码过期与失败次数限制均沿用上游；按验证码去重的打印逻辑也保留。新码在过期或达到失败次数上限后由原逻辑生成，再显示到终端。上游客户端补齐请求及重新获取验证码的入口后，应移除此补丁，并重新验证未授权浏览器首次访问。

修复后，未授权 Chrome 打开原始 Inspector 页面即可触发终端验证码，无需外部脚本请求。新增两项真实 HTTP/WebSocket/RPC 回归，补丁前均因缺少提示失败，补丁后验证首次握手、错误码拒绝、第五次错误后的新码提示、正确授权及可信令牌重连通过。另从无 `node_modules` 的副本执行冻结安装、47 项测试、全部类型检查、lint 和 H5 构建，均通过；锁文件 SHA256 前后保持 `5e5604a049ef88e9fd6850069db0a7c9b195518012f3a30bb8325ae5b9498191`，包版本没有变化。

这些结果支持采用新组合，原“UnoCSS 只能停在 66.8.1”的结论已撤回。但 optional peer 不等于上游已声明支持任意 Vite：`@devframes/vite@0.9.18` 对 Vite 5 的声明差距仍保留记录，本次验证证明的是当前配置的实际路径，没有修改 peer 声明、关闭 Inspector 或替换 DCloud 的 Vite 来消除提示。

Sass 1.79 起提示 legacy JS API 弃用，1.80 起提示 `@import` 和全局内置函数弃用。当前 Vite 5.2.8 仍调用 `sass.render`；Vite 从 5.4 起才支持配置现代 Sass API，因此保留 Sass 1.x 与现有 DCloud 编译链。为减少这项已知工具链提示，已在 `css.preprocessorOptions.scss` 和 `sass` 中设置 `silenceDeprecations: ['legacy-js-api']`。该设置不表示旧 API 已迁移，其他弃用提示、普通警告和编译错误继续保留；升级 DCloud 配套工具链并切换新 API 后，应移除此兼容项。[Sass legacy API 与定向静默说明](https://sass-lang.com/documentation/breaking-changes/legacy-js-api/)、[Sass import 弃用](https://sass-lang.com/documentation/breaking-changes/import/)

修改后的 H5 开发服务、H5/微信/App 构建均未再输出 `legacy-js-api`；H5 三份 CSS 的路径及 SHA256 与修改前一致。额外运行 Sass 警告和语法错误探针，确认普通 `@warn` 仍被报告、无效语法仍抛错，Node 配置类型检查及定向 lint 通过。

### 图表和国际化的验证边界

ECharts 6.1.0 相对 6.0.0 有明确破坏性变化：

- `tooltip.valueFormatter` 第二参数变为原始数据索引，不能继续当作 dataZoom 过滤后的索引
- `axis.startValue` 不再隐含设置 `min`，需要旧行为时应同时设置两者
- 柱形、象形柱、K 线和箱线图的边缘形状默认不溢出 grid，恢复旧布局需要设置 `containShape: false`

当前项目没有图表实例或 option，这些变化没有命中业务代码。构建成功仅验证接入，不能证明实际图表交互已覆盖。uni-echarts 2.5 由插件自动添加 `optimizeDeps.exclude`，本次已移除 Vite 中重复的手写配置。[ECharts 6.1 发布说明](https://github.com/apache/echarts/releases/tag/6.1.0)、[uni-echarts 2.5](https://github.com/xiaohe0601/uni-echarts/releases/tag/v2.5.0)

vue-i18n 的根依赖更新到 9.14.5，不代表 App/小程序实际执行的国际化运行时也同步升级。DCloud 对这些平台设置 alias，指向它内置的 patched 9.1.9。项目暂未使用 `createI18n` / `useI18n`，本次保留 9.x，避免进一步扩大不同平台的 API 差距。11 的 npm peer 实际允许 Vue 3.4，因此这里是跨平台契约取舍，并非声称 11 无法安装。[DCloud 国际化接入](https://uniapp.dcloud.net.cn/tutorial/i18n.html)、[vue-i18n 11 元数据](https://registry.npmjs.org/vue-i18n/11.4.10)

Vue I18n 9/10 已结束维护，保留 9.14.5 不能消除 DCloud 内置 9.1.9 的维护限制。10 调整 legacy `t` / `$t` 的第二字符串参数语义，11 删除 `tc` / `$tc`；直接把根类型及 H5 更新到 11，而 App/小程序仍执行 9.1.9，会形成不同平台的 API 差异。后续正式接入国际化时，需要按平台验证具体 API，或等待 DCloud 更新内置运行时后再统一迁移。[Vue I18n 维护状态](https://vue-i18n.intlify.dev/guide/maintenance)、[v10 破坏性变更](https://vue-i18n.intlify.dev/guide/migration/breaking10)、[v11 破坏性变更](https://vue-i18n.intlify.dev/guide/migration/breaking11)

### TypeScript 与配置覆盖

TypeScript 已精确改为 5.9.3。原 `baseUrl: '.'` 在相对路径映射 `@/*: ['./src/*']` 下没有必要，删除后仍保持删除，没有为了版本对齐恢复冗余选项或加入 `ignoreDeprecations`。此前 TS6 检查通过的记录只说明当时可运行，不再作为当前必须保留 TS6 的理由。

原来虽然安装了 `@vue/tsconfig`，实际没有 `extends`。当前业务配置实际继承 `@vue/tsconfig/tsconfig.dom.json`，并保留 uni-app 平台 types、pages `/client` 和 Volar 插件；根 `tsconfig.json` 作为 solution 引用三个独立配置。[Vue tsconfig 官方说明](https://github.com/vuejs/tsconfig)

| 配置 | 检查范围与边界 |
| --- | --- |
| `tsconfig.app.json` | Vue 业务源码与平台声明，排除测试；使用应用 Vite 5 类型 |
| `tsconfig.node.json` | 根工具配置及构建插件，使用 Node 类型；不提供 DOM/window |
| `tsconfig.test.json` | 源码测试、插件测试和 `tools/testing` 配置；显式使用测试工作区的 Vitest 4 / Vite 6 类型 |
| 根 `tsconfig.json` | 仅组织 app/node/test references；统一检查命令需要实际遍历三个项目，不能把空 solution 的 noEmit 退出码当作完整检查 |

正式安装后的 app/node/test 三项类型检查均通过。TypeScript 5.9.3 server 的 `projectInfo` 也确认：`src/main.ts` 属于 app、`vite.config.ts` 属于 node、Tabbar 测试与 `tools/testing/vitest.config.ts` 属于 test；应用与工具解析 Vite 5.2.8，测试解析 Vite 6.4.3 / Vitest 4.1.11。Vue 3.4 compiler-sfc 对根 references 下的 alias 与类型宏解析另已通过。

拆分配置并不意味着所有传递全局都已隔离。node 项目确实没有 DOM/window；app 虽未主动列入 Node types，仍会经 pages 相关声明传递引入 Node 全局，不能声称业务环境已严格禁止 Node API。该边界与检查通过一并记录。`pnpm type-check` 串行调用 `type-check:app`、`type-check:node` 和 `type-check:test`，完整命令已通过；子项目均采用 noEmit 检查，不产生构建声明文件。

微信类型 v5 改动 Component/Behavior/Page 的返回品牌类型、标识符类型名及属性默认值推导。项目主要使用 uni-app API，未发现直接依赖相关原生泛型的调用；它是声明更新，不是微信基础库运行时升级。carbon 更新后的五个现用图标名称，以及 line-md 的 `chevron-left`，均已通过图标数据核对存在。[微信类型 CHANGELOG](https://github.com/wechat-miniprogram/api-typings/blob/master/CHANGELOG.md)

### 测试环境与 ESLint

首轮经过 Vitest 3 的 mock、fake timers 和选项迁移后，本轮继续迁至独立工作区中的 Vitest 4.1.11。现有测试验证 Vue 组件、组合函数及 CLI 进程，不等同于 create-uni 的 `vitest-environment-uniapp` 真机/开发者工具自动化示例，因此保留 Happy DOM/Node 测试环境。本轮同时验证了配置加载、Vue 编译、别名、pages.json 与真实依赖解析。[Vitest 4 迁移](https://v4.vitest.dev/guide/migration)、[create-uni 小程序测试配置](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/template/module/vitest/vitest.config.js)

实际命中的迁移问题是生成的 `src/pages.json` 含注释，Vite 6 会在测试 mock 接管前尝试按 JSON 解析。测试配置通过 `test.server.deps.external` 精确匹配该文件，让既有 mock 接管；没有关闭所有 JSON 转换或改变生产生成文件。修正后，8 个测试文件、45 项测试在实际 Vitest 4.1.11 中全部通过。

Happy DOM 16 重构解析器，19 移除 CommonJS，20 默认禁用页面 JavaScript evaluation。项目由 Vitest 提供 DOM，没有直接依赖 Browser API、页面 eval 或序列化快照，不应为了恢复旧默认而全局启用脚本执行。Vue Test Utils 2.5 删除 class component 支持并调整卸载时 emitted 清理，项目没有相应旧组件写法。[Happy DOM 19](https://github.com/capricorn86/happy-dom/releases/tag/v19.0.0)、[Happy DOM 20](https://github.com/capricorn86/happy-dom/releases/tag/v20.0.0)、[Vue Test Utils 2.5](https://github.com/vuejs/test-utils/releases/tag/v2.5.0)

ESLint 10 移除旧配置和 RuleContext API，并调整推荐规则。项目已用 flat config，升级采用 uni-helper 0.7.5，并显式声明 `@antfu/eslint-config` 9.5.1，确保这组配置依赖与 ESLint 10 对齐。[ESLint 10 迁移](https://eslint.org/docs/latest/use/migrate-to-10.0.0)、[uni-helper ESLint 配置](https://github.com/uni-helper/eslint-config)

实际配置已从 `uniHelper({ rules })` 改为 `uniHelper({}, { rules })`，把项目规则作为后置配置传入。原写法中的规则可能被后续 uni-helper 配置覆盖，文件里写了关闭规则不等于最后生效。本次保持项目已有的单行元素换行偏好，并通过正确配置顺序落实它。

### ESLint 的可选测试运行器依赖

移除根 Vitest 后，旧锁文件仍通过 `@antfu/eslint-config → @vitest/eslint-plugin` 的 optional peer 保留 Vitest 3。无锁解析又会为这条根工具路径选择 Vitest 4，并把它绑定到根 Vite 5，不能据此声称测试工具已经完全隔离。

已检查 `@vitest/eslint-plugin@1.6.27` 的发布代码：规则分析测试源码和类型，没有运行时导入 Vitest。`.pnpmfile.mjs` 的 `readPackage` 因此只对该精确版本删除 `vitest` 的 `peerDependencies` 与 `peerDependenciesMeta`，保留 ESLint 插件及所有规则。这是移除未使用的可选依赖边，没有把 Vitest 的 Vite 6 要求改成允许 Vite 5，也没有关闭 peer 告警。[已发布包元数据](https://registry.npmjs.org/@vitest%2Feslint-plugin/1.6.27)、[pnpm readPackage hook](https://pnpm.io/pnpmfile#hooksreadpackagepkg-context-pkg--promisepkg)

最终锁文件不再包含 Vitest 3；Vitest 4.1.11 与 mocker 都只连接 Vite 6.4.3。重新解析基于原锁文件，保留的同名快照没有无关依赖连边变化。完整 lint 通过，故意重复测试标题并使用 `.only` 的 stdin 探针仍触发 `test/no-identical-title` 和 `test/no-only-tests`，修正后的同一探针通过。

后续升级该 ESLint 插件时，应重新核查运行时及类型依赖，不直接扩大 hook 的版本条件。如果新版需要实际加载 Vitest，应重新安排工具依赖边界；上游去掉这项可选 peer 后即可移除此 hook。

## 本地补丁与回归维护

首轮维护了两项精确版本补丁。当前 applet 已升级到包含修复的上游版本，旧属性补丁及其 pnpm 映射已移除；现保留 unh 0.3.2、devframe 0.9.18 和 `@unocss/vite` 66.10.1 补丁，由 `patchedDependencies` 自动应用。升级对应包时应检查上游修复与回归结果，不依赖手工修改 `node_modules`。

### UnoCSS 重复解析误报

微信开发编译中，uni-app 对 `src/main.ts` 的同一条 `import 'uno.css'` 解析四次，均得到同一个 `src/__uno.css`。UnoCSS 66.10.1 只检查 layer 是否已登记，因此后三次被误报为跨文件重复导入。[上游判断](https://github.com/unocss/unocss/blob/v66.10.1/packages-integrations/vite/src/modes/global/build.ts#L84-L100)

`patches/@unocss__vite@66.10.1.patch` 在提示前比较已登记入口与本次入口：相同入口重复解析不报警，不同目录的入口冲突仍保留警告及采用首个入口的行为。`plugins/vite/unocss-import.test.ts` 通过应用实际安装的 Vite/UnoCSS 解析钩子覆盖这两种情况；同入口测试在补丁前出现三条警告而失败，补丁后两项均通过。上游修复该判断后，应移除补丁并重新验证两项回归。

独立副本中的微信开发编译在补丁后完成，重复导入警告由三条降为零，七份 WXSS 文件与补丁前逐字节一致。完整测试为 10 个文件、49 项通过，三类类型检查和完整 lint 通过。此次验证仅覆盖编译和样式产物；微信开发者工具打开项目仍需有效的 `mp-weixin.appid`，模板保留自动打开配置。单独运行本机开发者工具 CLI 的 `islogin` 也能复现 `punycode` 弃用提示，该提示不来自应用编译路径。

### 小程序多行属性转换

`@unocss-applet/transformer-attributify@0.14.0` 在计算属性片段偏移时只查找普通空格。标签名后直接出现换行或制表符时，后续 MagicString 编辑位置可能偏移，破坏生成 class 或既有属性。

首轮补丁只把属性起点计算中的 `indexOf(' ')` 改为 `search(/\s/)`，统一处理首个空白字符。复核确认 applet 0.15.1 已包含相同修复，本轮升级后删除了 `patches/@unocss-applet__transformer-attributify@0.14.0.patch`，不再将这项问题描述为上游未修复。[上游修复源码](https://github.com/unocss-applet/unocss-applet/blob/5133ecb4f47c91f9b1334bdcaae46217eafe14dc/packages/transformer-attributify/src/index.ts#L159-L166)

`plugins/vite/attributify.test.ts` 直接调用实际 transformer、UnoCSS generator 和 MagicString，再用 Vue SFC parser 检查转换后的结构。五项回归覆盖 LF、CRLF、制表符、单行空格，以及分组属性与无值属性混用；同时断言 class 完整、`hover-class` 保留且没有重复残留属性。新增 `unocss-applet` 和 `magic-string` 直接开发依赖，是为了明确这些测试的真实导入来源。

移除补丁后，上述五项回归在 UnoCSS 66.10.1 / preset 0.5.1 / applet 0.15.1 组合中全部通过，测试保留。新版 Inspector 与 Vite 5 的声明差距及实际开发验证单独记录于样式兼容章节；不把补丁可移除混同于整条依赖链没有任何 peer 差距。

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
| `package.json.pnpm.patchedDependencies` | 已迁入工作区 YAML；当前保留 unh、devframe 与 UnoCSS Vite 精确版本补丁，applet 补丁随上游修复移除 |
| `.npmrc` 的 `auto-install-peers` | 已迁为 `autoInstallPeers: true` |
| `.npmrc` 的 `shamefully-hoist` | 已迁为 `shamefullyHoist: true` |
| `.npmrc` 的 `strict-peer-dependencies` | 已迁为 `strictPeerDependencies: false`，保留原项目设置；当前 Uno Inspector 的声明差距公开记录 |
| 三份 `unconfig: 7.3.2` 覆盖 | 已移除失效覆盖 |
| registry | 保留原项目 registry，`.npmrc` 仅维护该项 |
| `.nvmrc` | 已精确固定为 `22.22.2`，避免 CI 命中较旧的 22.x 缓存 |

构建许可沿用逐包列表，并按实际安装图记录 `@parcel/watcher: true` 和 `core-js-pure: false`，不照搬 create-uni 产物的 `dangerouslyAllowAllBuilds: true`。pnpm 12、Node 精确版本及现有 CI 安装流程已完成迁移，因此本轮保留，不为形式对齐撤销既有工作。[create-uni 构建许可](https://github.com/uni-helper/create-uni/blob/30d1ea9dc6c9ec9088f2a3987e2797b6079d4dca/packages/core/template/base/pnpm-workspace.yaml#L1)

`shellEmulator: true`、严格发布时间、`trustPolicy: no-downgrade` 和 `minimumReleaseAgeExcludePrune: true` 等属于当前项目选择保留的额外安装策略，不是 DCloud、create-uni 或采用 pnpm 12 的必要条件。它们会改变可安装版本和历史包处理方式，不能作为依赖兼容已经成立的证明。本轮复核没有继续增加治理项；相关迁移与例外仅按现有配置如实记录。[pnpm 11 默认值变化](https://github.com/pnpm/pnpm.io/blob/main/blog/releases/11.0.md)

### 发布等待期与锁文件重解析

本次保留 pnpm 12 默认的 `minimumReleaseAge: 1440` 分钟。首次迁移时，旧 pnpm 10 锁文件包含 12 项尚未满足该时限的发布：Babel 8.0.5 系列、uni-types 1.3.0 及三个配套类型包、baseline-browser-mapping 2.11.22、electron-to-chromium 1.5.427、micromark-extension-gfm-table 2.1.2、nanoid 3.3.19 和 update-browserslist-db 1.3.3。旧锁文件已记录这些版本，并不代表它们满足新安装器的发布等待规则。

重新解析时，pnpm 曾自动为 uni-types 系列四包和 update-browserslist-db 添加五项 `minimumReleaseAgeExclude`，导致声明 `^1.1.0` 仍选入 1.3.0。本次已删除这些自动豁免，并明确设置 `minimumReleaseAgeStrict: true`，按默认等待时限重新解析锁文件；没有通过降低时限解决安装拒绝。

uni-types 的目标因而改为 1.1.0，声明范围为 `^1.1.0`；最终锁文件已解析为 1.1.0，三个配套类型包及对应 peers 也统一为 1.1.0。调查时 latest 1.3.0 的发布时间为 `2026-09-11T03:31Z`，在这次解析发生时尚未满 24 小时。这是发布等待期内的版本选择，并非发现 1.3.0 本身不能运行；后续更新可在满足等待时限后重新评估。最终安装保留 1440 分钟严格等待期，没有任何 `minimumReleaseAgeExclude`。[uni-types 发布元数据](https://registry.npmjs.org/@uni-helper%2Funi-types)、[pnpm 迁移文档](https://github.com/pnpm/pnpm.io/blob/main/docs/migration.md)

`trustPolicy: no-downgrade` 另命中了 DCloud 精确依赖的 `@vitejs/plugin-legacy@5.3.2`。该版本发布于 `2024-03-08T12:40:20.991Z`，发布者为 vitebot，发布元数据没有 provenance，而更早的稳定版 4.0.4 已有该证明，因此符合 pnpm 按发布时间判定的信任降级规则；npm 官方与镜像的时间、完整性和证明信息一致，本次解析的 SHA512 也与原锁文件相同。为兼容这一历史发布，工作区使用官方 `trustPolicyIgnoreAfter: 525600` 分钟设置，将信任降级检查保留在最近一年发布的包上。

这是策略范围的明确取舍：一年以前发布的包不再接受该项信任降级检查，不能把安装通过表述为所有包的完整信任检查都通过。它与版本 peer 是独立问题；此前 uni-manifest-types / TS6 例外已通过对齐 TypeScript 5.9.3 消除。[pnpm trustPolicyIgnoreAfter 说明](https://github.com/pnpm/pnpm.io/blob/main/versioned_docs/version-10.x/settings.md#trustpolicyignoreafter)

### 本机引导与 CI 配套

首次由旧 pnpm 10 自动引导 pnpm 12 时，本机精确版本缓存出现 `ENOEXEC`。针对该版本缓存执行官方 `install.js` 后，pnpm 12.4.1 已能启动；这属于本机引导修复，没有修改项目构建逻辑。另已验证通过 `npm exec` 启动精确 pnpm 12.4.1 的方式，可用于旧 pnpm 引导失败的环境。

CI 的 `pnpm/action-setup@v4` 不支持新的 pnpm 12 安装流程，工作流已升级为 `v6.1.0`，该发布明确加入 pnpm 12 支持。Node 仍从精确 `.nvmrc` 读取；本机命令启动成功和实际 CI 成功分开记录。[action-setup 6.1.0 发布说明](https://github.com/pnpm/action-setup/releases/tag/v6.1.0)

### pnpm 12 引导锁记录

全新 archive 检出验证发现：已有本机缓存时 `--frozen-lockfile` 可以通过，空安装目录却报 `Cannot update packageManagerDependencies with frozen-lockfile`。锁文件只包含应用依赖，还不足以覆盖 pnpm 12 的自身引导过程。

已将 pnpm 12.4.1 自动生成的包管理器 YAML document 加入同一锁文件，记录精确 pnpm 及其平台可执行包的完整性信息。原应用依赖 document 逐字保持不变，没有重新升级或降级传递依赖。此记录与 README 中的安装方式、CI 使用的 pnpm 12 安装 Action 配套维护。修正后从新的 archive 直接冻结安装通过，随后测试、类型、lint 和 H5 构建通过；安装前到构建后锁文件 SHA256 均为 `1fcc8ecbe325ea96d31b3225d113458aebfddee90e84acbddd175a4a1a59ab28`。

## 平台发行注意事项

DCloud 发行日志同时包含 uni-app 与 uni-app x，UTS、uvue 和蒸汽模式说明不能直接套用到当前 Vue 3 uni-app。日志中的 UnoCSS app.wxss、分包依赖修复与当前构建更相关。5.14 默认开启统计公有版，本次保留项目显式的 `uniStatistics.enable: false`，生成 manifest 一并纳入回归核对。[uni-app 发行日志](https://uniapp.dcloud.net.cn/release)

原生云打包的 Xcode、iOS SDK、最低 iOS 和 Android compileSdk 也随发行线变更。H5/微信构建无法验证原生基座、权限、真机手势或云打包；实际发布原生应用时需与所选正式版基座配套验证。[App 打包环境](https://uniapp.dcloud.net.cn/tutorial/app-env.html)

## 未升级项的明确理由

| 原因 | 依赖 |
| --- | --- |
| 已是调查时 latest | plugin-uni 0.1.0、uni-layouts 0.1.11、bundle-optimizer 2.2.0、z-paging 2.8.8、Alipay 类型 3.0.14、line-md 1.2.16 |
| DCloud 正式编译器配套约束 | Vue/runtime-core 3.4.21、Vite 5.2.8、plugin-vue 5.2.4 |
| 当前项目的严格发布等待期 | uni-types 暂选 1.1.0；UnoCSS 采用 66.10.1。对应最新 1.3.0 / 66.10.2 在各自解析时不足 24 小时，未添加豁免 |
| Vue peer 约束 | Pinia 2.2.4；persistedstate 精确对齐 4.1.3 |
| 模板支持范围与现有需求 | TypeScript 精确 5.9.3；没有必须保留 TS6 的已识别需求 |
| 跨平台运行时或 API 约束 | vue-i18n 9.14.5、Sass 1.104.0 |
| 独立测试链的迁移目标 | Vitest 4.1.11 / Vite 6.4.3；不要求同时升级应用的 Vite |

这组保留项不是遗漏。后续需要跨过 Vue/Vite 上限时，应重新评估 DCloud 发布线及全部 uni-app 插件，而不能只放宽 peer 检查。

## 已知漏洞审计与定向修复

以同一 npm 官方审计数据库比较原始 `82b45f5`、首轮升级快照和当前锁文件。基线只读取临时目录中的旧文件，没有安装旧依赖。

| 严重程度 | 原始基线 | 首轮升级 | 本轮最终 |
| --- | --- | --- | --- |
| Critical | 25 | 0 | 0 |
| High | 78 | 11 | 11 |
| Moderate | 58 | 24 | 22 |
| Low | 11 | 9 | 9 |
| 合计 | 172 | 44 | 42 |

命令为 `pnpm audit --json --registry=https://registry.npmjs.org`，最终退出码为 1，表示仍有已知漏洞；按包名和 GHSA 对照原始基线，没有新增组合。计数会受同一公告在不同版本上的重复命中影响，也不等于生产应用存在相同数量的可利用入口。全部 42 项公告、已安装版本、修复范围及直接上游已更新到[精简审计快照](dependency-audit-2026-09-12.json)。

最后一项 Critical 来自 `uni-layouts → c12 → giget 1.2.5 → tar 6.2.1`。它还包含多个路径处理与资源耗尽公告。项目并未使用远程模板解包，uni-layouts 0.1.11 的发布代码也未实际导入其声明的 c12；这不是已确认的业务攻击路径。不过旧 tar 仍在依赖树中，本次通过精确 `giget@1.2.5>tar: 7.5.22` 覆盖修复了该分支的全部 12 项公告。[tar 资源耗尽公告](https://github.com/advisories/GHSA-23hp-3jrh-7fpw)、[后续路径处理公告](https://github.com/advisories/GHSA-r292-9mhp-454m)

这是经过验证的跨主版本覆盖：tar 7 要求 Node 18 及以上，当前 Node 满足；giget 使用的命名 `extract` 导出、Promise 完成契约和 `onentry` 路径处理仍可用。`plugins/layout-archive.test.ts` 沿 layouts 的真实依赖链加载 giget，在独立临时缓存中创建并离线提取小归档，验证仓库根目录剥离及子目录选择，两项均通过。升级 layouts/c12/giget 后，若其正常依赖已使用安全 tar，且这两项测试通过，即可移除该定向覆盖。

最终剩余的 11 项 High 涉及 Vite、DCloud 固定的 PostCSS、ws、adm-zip、Intlify，以及 Express 的 path-to-regexp 和 Jimp 的 jpeg-js。它们的公开修复版本超出当前上游声明或精确版本，需要分别适配编译器内部用法。本轮继续保留正式应用编译链；仅升级项目根依赖或测试工作区不能代表 DCloud 内置依赖已同步修复。

首轮 Vitest / `@vitest/mocker` 3.2.7 命中中危 GHSA-82fw-gwwq-j7x9。官方公告说明 2/3 已停止维护，修复从 4.1.11 起；create-uni 模板的 4.1.10 同样未包含该修复。本项目原测试方式未暴露公告描述的公开 mocker 插件接口，但这不能替代依赖修复。当前测试工作区已安装 4.1.11，ESLint 的旧 Vitest 路径也已清除；最终审计中 Vitest / mocker 的两项中危命中均已消失。[Vitest 官方公告](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9)

## 验证结果

验证环境为 macOS arm64、Node.js 22.22.2、pnpm 12.4.1，分支为 `chore/dependency-upgrades`。以下为本轮最终验证；首轮的完整执行记录可在 `2219ba2` 查看。

首轮新增的 15 项测试验证真实 store 持久化（3 项）、小程序属性转换（5 项）、unh CLI 成败传播（5 项）和归档提取兼容（2 项），本轮全部保留。两项补丁当时均经过失败与修复对照；本轮只移除已被上游修复的属性转换补丁。

### 最终验证

| 检查 | 当前结果 |
| --- | --- |
| TypeScript 5.9.3 | 已提交 `38d5348`，对齐模板与 TS5 peer |
| UnoCSS 66.10.1 / preset 0.5.1 / applet 0.15.1 | 已提交 `d44f901`；移除属性补丁，五项属性回归通过 |
| Inspector SPA、资源及 RPC | 通过；官方客户端认证后获取真实项目、66.10.1 版本、模块与 CSS |
| Inspector 首次授权 | 补丁后未授权 Chrome 访问可触发验证码；两项真实连接回归覆盖握手、错误码限制、换码与可信重连 |
| Inspector 与浏览器 HMR | 通过；137px → 139px → 恢复源码，模块 CSS、虚拟样式、浏览器计算样式一致，收到 Inspector/Vite 更新通知 |
| H5 服务重启 | 通过；旧 RPC 连接断开，重启后新 RPC 与 Vite HMR 连接成功 |
| 测试依赖隔离 | app/node 使用 Vite 5.2.8，test 使用 Vite 6.4.3 / Vitest 4.1.11；无残留 Vitest 3 |
| `pnpm type-check` | 统一入口及 app/node/test 三项检查全部通过 |
| 编辑器项目归属 | TS server 5.9.3 的 projectInfo 确认 main→app、vite.config→node、Tabbar 测试和测试配置→test |
| Vue 类型宏与 alias | Vue 3.4 compiler-sfc 对根 references 下的解析通过 |
| 新测试工作区全量测试 | 实际 Vitest 4.1.11 执行，10 个文件、49 项全部通过 |
| 本轮五种构建 | `build:test`、H5、微信、支付宝与 App 均通过；test mode 复制目录 diff 一致 |
| 本轮路由产物 | 2 个主包页面、2 个分包共 3 个页面，tabBar 正确且无重复路径 |
| 本轮生产浏览器冒烟 | 首页 → Demo → 中文参数 hi 页面通过；计数器加到 1、刷新仍为 1，warn/error 日志为空 |
| ESLint 与规则探针 | 完整 lint 通过；重复标题和 `.only` 反例被拒绝，修正后通过 |
| 全新检出的冻结安装 | 从 `08335ef` 创建无 node_modules 的 archive，直接冻结安装通过；随后测试、三类类型检查、lint、H5 构建通过，锁文件 SHA256 始终不变 |
| 最终漏洞审计 | 42 项：0 Critical、11 High、22 Moderate、9 Low；无 Vitest / mocker 命中 |

仍存在以下明确边界：

- TypeScript 已回到 5.9.3，原 manifest-types / TS6 peer 例外已消除；`@devframes/vite@0.9.18` 的 optional peer 仍只声明 Vite 7/8，当前 Vite 5 活跃路径已有实际验证。
- node 类型项目没有 DOM/window；业务类型仍通过 pages 传递声明引入 Node 全局，不能把配置拆分描述成业务环境已完全隔离 Node API。
- Sass 的 `legacy-js-api` 提示已定向静默；实际仍使用 Vite 5.2.8 的旧调用方式，Sass 2 不在当前可升级范围。
- Vue I18n 9 已结束维护，DCloud 平台内置 9.1.9 的限制也未由根依赖升级消除。
- `trustPolicyIgnoreAfter` 只对最近一年发布版本执行信任降级检查；完整性校验、发布等待期和构建脚本许可仍独立生效。
- 本次没有执行远端 GitHub Actions、云打包、原生基座/真机运行及其他小程序平台运行。App 构建成功不等于原生发行验证；图表和国际化暂未接入业务实例，未声称覆盖其交互。

本轮验证启动的服务与浏览器页均已关闭。构建仅改变 `pages.json` 的平台生成注释，核对后已恢复；临时 HMR 样式也已恢复。

## 提交记录

升级按依赖拆分提交。DCloud 同批次 20 个包作为不可拆开的编译兼容单元；ESLint 配置组、UnoCSS 预设及其必要补丁按配套关系提交。后续发现的接入修正另作小提交，便于独立审查。

下表保留首轮文档提交前的 34 个实施提交，标题按历史原样记录，不表示其中每次中间决策仍是当前目标。uni-types 曾验证 1.3.0，随后按发布等待期调整到 1.1.0；TypeScript 6、Vitest 3 与 UnoCSS 66.8.1 的后续纠正分别见当前矩阵和下方追加记录。

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

已完成的后续纠正：

| Commit | 变更 |
| --- | --- |
| `38d5348` | chore(deps): 将 TypeScript 对齐 create-uni 的 5.9.3 |
| `d44f901` | chore(deps): 对齐新版 UnoCSS 预设并移除已修复补丁 |
| `b97f679` | chore(deps): 升级 Vitest 4 并隔离测试 Vite 工具链 |
| `4b645ed` | chore(types): 拆分业务、Node 与测试项目配置 |
| `08335ef` | fix(pnpm): 补全全新检出所需的包管理器锁记录 |
