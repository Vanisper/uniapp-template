# uniapp 项目模板

> author: `Vanisper`
>
> version: `v1.0`
>
> 本项目基于 https://github.com/Moonofweisheng/wot-design-uni 的构建思路，并且使用了该项目的组件库，加上了一些自己的想法，实现了一套uniapp的模板项目，方便快速开发uniapp项目。

## 技术栈

- 基本：Vue3 + Vite + Unocss + Typescript
- Uni-Helper 相关插件：自动import、page.json自动生成、组件自动全局挂载、方法自动全局挂载、页面自动挂载layouts
- 组件库：wot-design-uni
- 路由库：uni-mini-router
- 全局状态管理：pinia

## 开发说明

强烈建议使用Vscode开发，本项目配备了一个快捷开启微信开发者工具的脚本（详见项目 `scripts\WeChat_DevTools.py`），
确保本机安装过python，并能全局调用（精力有限，只用python实现了这个脚本）。
确保打开了微信开发这工具的“安全”——“服务端口”——“开启服务端口”选项。

使用 `pnpm dev` 即可快速打开微信开发者工具，`pnpm build` 则是运行build命令并打开微信开发者工具（其他WeChat_DevTools的用法详见该脚本）。

## 路由说明

> 详情见项目根目录下的 `src/router` 文件夹，查看细节

1. 考虑到小程序的分包的需求, `src/router/modules` 文件夹下又分了 `main` 和 `sub` 两个文件夹，分别存放主包和分包的路由；
2. `src/router/modules/[main|sub]` 文件夹下的一个文件即为一个路由模块，命名格式为 `*.route.ts`；
3. `src/router/modules/main` 文件夹下的主包模块需要引入类型 `import type { AppPageMetaDatum } from "@/router/types"`；
4. `src/router/modules/sub` 文件夹下的分包模块需要引入类型 `import type { AppSubPackage } from "@/router/types"`；
5. 最后需要在 `src/router/routes.ts` 中引入这些模块，并且将其添加到 `pagesList` 或 `subPackages` 变量中（注意类型标注，分别对应主包、分包）；

---

建议使用 `pnpm` 作为包管理器，其余包管理器未作测试。

## 小程序发布

本项目使用了 `uni-mini-ci`，可以直接使用命令行工具提交小程序；

需要注意项目根目录下的 `.minicirc` 文件，其中的 `appid` 和 `privateKeyPath` 需要根据小程序实际的id填写，同时需要在小程序后台的开发管理，将key文件下载下来放置 `privateKeyPath` 指定的路径，并且需要关闭ip白名单

## 项目提交说明

本项目为了代码风格的统一以及git提交风格的统一，添加了一些插件，实现了代码格式、提交规范的检测；

相关插件有 `eslint`、`git-cz`、`husky`、`commitlint`；

---

需要提交的时候请不要直接使用git命令提交，否则非常大几率提交不成功（因为你事先不会知道本项目设定好的git提交规范是什么，详见项目根目录 `.git-cz.json` 文件）；

为了能顺利提交，可以看到 `package.json` 的scripts中有一个 `commit` 命令，所以你只需要运行 `pnpm commit`，就可以根据指引进行代码提交（记住在此之前，需要手动将需要提交的代码文件暂存）；
