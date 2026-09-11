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

平台名是 unh 的位置参数；测试环境构建使用 `pnpm build:test`。主要依赖的兼容范围、迁移原因与验证结果见[依赖升级记录](docs/dependency-upgrade-2026-09-12.md)。

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
