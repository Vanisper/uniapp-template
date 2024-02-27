# uniapp 项目模板

## 技术栈

- 基本：Vue3 + Vite + Unocss + Typescript
- Uni-Helper 相关插件：自动import、page.json自动生成、组件自动全局挂载、方法自动全局挂载、页面自动挂载layouts
- 组件库：wot-design-uni
- 路由库：uni-mini-router
- 全局状态管理：pinia

## 开发说明

强烈建议使用Vscode开发，本项目配备了一个快捷开启微信开发者工具的脚本（详见项目`scripts\WeChat_DevTools.py`），
确保本机安装过python，并能全局调用（精力有限，只用python实现了这个脚本）。

使用 `pnpm dev` 即可快速打开微信开发者工具，`pnpm build` 则是运行build命令并打开微信开发者工具（其他WeChat_DevTools的用法详见该脚本）。

---

建议使用 `pnpm` 作为包管理器，其余包管理器未作测试。
