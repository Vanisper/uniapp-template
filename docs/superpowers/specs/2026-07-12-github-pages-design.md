# GitHub Pages 部署工作流设计

## 目标

为仓库增加 GitHub Pages 自动部署能力。直接推送到 `main` 或通过 Pull Request 合并到 `main` 后自动部署，同时保留手动触发入口。

## 触发策略

工作流监听：

- `push.branches: [main]`
- `workflow_dispatch`

Pull Request 合并会在 `main` 上产生 push，因此不额外监听 `pull_request`。未合并的 PR 不部署到正式 Pages 环境。

## 构建路径

`vite.config.ts` 使用相对 base：

```ts
base: './'
```

相对 base 使构建后的脚本和样式资源相对于 `index.html` 加载，不绑定仓库名 `/uniapp-template/`，也兼容后续改名或使用自定义域名。

uni-app H5 构建继续执行现有 `pnpm build`，发布目录为 `dist/build/h5`。

## 运行时版本

工作流不重复声明项目版本：

- `actions/setup-node` 通过 `node-version-file: .nvmrc` 使用 Node 22
- `pnpm/action-setup` 通过 `package.json#packageManager` 使用 pnpm 10.32.1
- 依赖安装使用 `pnpm install --frozen-lockfile`

## 工作流结构

### Build

1. Checkout 仓库
2. 按 `packageManager` 安装 pnpm
3. 按 `.nvmrc` 安装 Node，并启用 pnpm 缓存
4. 使用冻结锁文件安装依赖
5. 执行 H5 构建
6. 配置 GitHub Pages
7. 上传 `dist/build/h5` Pages artifact

### Deploy

部署 job 依赖 build job，使用 `actions/deploy-pages` 发布 artifact，并把部署 URL 写入 `github-pages` environment。

## 权限与并发

工作流只声明 GitHub Pages 官方流程需要的权限：

- `contents: read`
- `pages: write`
- `id-token: write`

使用 `pages` concurrency group，新的部署排队等待当前部署完成，不中断正在进行的发布。

## 前置条件

仓库需要在 Settings → Pages 中把 Source 设置为 GitHub Actions。这是一次性的仓库设置，不由本地 workflow 文件替代。

## 验证与验收

本地验证包括：

- `pnpm build` 成功
- `dist/build/h5/index.html` 不包含以 `/assets/` 开头的资源路径
- `index.html` 引用的本地脚本、样式和静态资源均存在于发布目录
- workflow YAML 可解析，Action 版本、权限、artifact 路径和 job 依赖符合官方 Pages 流程
- `git diff --check` 无空白错误

验收标准：推送或合并到 `main` 后构建并部署 H5 artifact，手动触发也执行同一流程；部署产物可在项目页子路径或自定义域名下正确加载资源。
