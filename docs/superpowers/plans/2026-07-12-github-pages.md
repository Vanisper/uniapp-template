# GitHub Pages Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 uni-app H5 增加可由 `main` 推送和手动触发的 GitHub Pages 自动部署，并确保静态资源在项目页子路径下正常加载。

**Architecture:** Vite 使用相对 `base` 生成不绑定仓库名的 H5 资源链接。GitHub Actions 分成 build 和 deploy 两个 job，build 复用仓库声明的 Node 与 pnpm 版本并上传 `dist/build/h5`，deploy 通过 GitHub Pages 官方 Action 发布同一 artifact。

**Tech Stack:** Vite 5、uni-app H5、pnpm 10、GitHub Actions、GitHub Pages

## Global Constraints

- 工作流只监听 `push.branches: [main]` 和 `workflow_dispatch`
- Pull Request 合并通过其产生的 `main` push 触发，不添加 `pull_request` 触发器
- Vite `base` 固定为 `'./'`
- Node 版本读取 `.nvmrc`，当前值为 `22`
- pnpm 版本由 `package.json#packageManager` 提供，当前值为 `pnpm@10.32.1`
- CI 依赖安装使用 `pnpm install --frozen-lockfile`
- Pages artifact 目录固定为 `dist/build/h5`
- 权限仅声明 `contents: read`、`pages: write` 和 `id-token: write`
- 并发组固定为 `pages`，且 `cancel-in-progress: false`
- 仓库 Settings → Pages 的 Source 需由维护者一次性设置为 GitHub Actions

---

## File Structure

- Modify: `vite.config.ts`，设置生产与开发共用的相对 Vite base
- Create: `.github/workflows/deploy-pages.yml`，构建、上传并部署 H5 Pages artifact

### Task 1: Configure Relative Vite Base

**Files:**
- Modify: `vite.config.ts`
- Verify: `dist/build/h5/index.html`

**Interfaces:**
- Consumes: 现有 `pnpm build` 脚本和 uni-app H5 输出目录 `dist/build/h5`
- Produces: 使用 `./assets/...` 相对 URL 的 H5 构建入口

- [ ] **Step 1: Build the current configuration and prove the regression case**

Run:

```bash
pnpm build
rg '(href|src)="/assets/' dist/build/h5/index.html
```

Expected: 构建成功，`rg` 至少输出一个以 `/assets/` 开头的 `href` 或 `src`，证明当前产物无法直接部署到 GitHub 项目页子路径。

- [ ] **Step 2: Add the minimal Vite configuration**

在 `vite.config.ts` 返回的配置对象顶部加入：

```diff
 return {
+  base: './',
   define: {
```

- [ ] **Step 3: Rebuild and verify the generated URLs**

Run:

```bash
pnpm build
rg '(href|src)="\./assets/' dist/build/h5/index.html
! rg '(href|src)="/assets/' dist/build/h5/index.html
```

Expected: 构建成功；第一条 `rg` 输出相对资源链接，第二条检查退出码为 0，表示不存在根路径资源链接。

- [ ] **Step 4: Verify every local entry asset exists**

Run:

```bash
node --input-type=module -e "import fs from 'node:fs'; import path from 'node:path'; const htmlPath = 'dist/build/h5/index.html'; const html = fs.readFileSync(htmlPath, 'utf8'); const refs = [...html.matchAll(/(?:href|src)=\"(\.\/[^\"?#]+)(?:[?#][^\"]*)?\"/g)].map(([, ref]) => ref); const missing = refs.filter(ref => !fs.existsSync(path.resolve(path.dirname(htmlPath), ref))); if (missing.length) { console.error(missing.join('\\n')); process.exit(1) } console.log('verified ' + refs.length + ' local assets')"
```

Expected: 输出 `verified <N> local assets`，且 `<N>` 大于 0。

- [ ] **Step 5: Commit the Vite base change**

```bash
git add vite.config.ts
git commit -m "build(pages): 配置 H5 相对资源路径"
```

Expected: 创建一个只包含 `vite.config.ts` 的提交。

### Task 2: Add the GitHub Pages Workflow

**Files:**
- Create: `.github/workflows/deploy-pages.yml`

**Interfaces:**
- Consumes: `.nvmrc`、`package.json#packageManager`、`pnpm-lock.yaml`、`pnpm build` 和 `dist/build/h5`
- Produces: 名为 `github-pages` 的 Pages artifact，以及部署到 `github-pages` environment 的 URL

- [ ] **Step 1: Create the workflow**

创建 `.github/workflows/deploy-pages.yml`：

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build H5
        run: pnpm build

      - name: Configure GitHub Pages
        uses: actions/configure-pages@v5

      - name: Upload GitHub Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist/build/h5

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Parse the YAML and assert the workflow contract**

Run:

```bash
ruby -e "require 'yaml'; YAML.parse_file('.github/workflows/deploy-pages.yml'); puts 'workflow YAML parsed'"
rg 'push:|branches:|main|workflow_dispatch:|contents: read|pages: write|id-token: write|group: pages|cancel-in-progress: false|node-version-file: .nvmrc|cache: pnpm|pnpm install --frozen-lockfile|pnpm build|actions/configure-pages@v5|actions/upload-pages-artifact@v3|path: dist/build/h5|needs: build|actions/deploy-pages@v4' .github/workflows/deploy-pages.yml
! rg 'pull_request:' .github/workflows/deploy-pages.yml
```

Expected: Ruby 输出 `workflow YAML parsed`；`rg` 输出全部契约项；最后一条检查退出码为 0，表示不存在 `pull_request` 触发器。

- [ ] **Step 3: Commit the workflow**

```bash
git add .github/workflows/deploy-pages.yml
git commit -m "ci(pages): 新增 GitHub Pages 部署工作流"
```

Expected: 创建一个只包含部署工作流的提交。

### Task 3: Final Verification and Review

**Files:**
- Verify: `vite.config.ts`
- Verify: `.github/workflows/deploy-pages.yml`
- Verify: `dist/build/h5/index.html`

**Interfaces:**
- Consumes: Task 1 的相对资源产物和 Task 2 的部署工作流
- Produces: 可供推送与仓库 Pages 设置使用的已验证分支

- [ ] **Step 1: Run project checks and a fresh production build**

Run:

```bash
pnpm type-check
pnpm lint
pnpm build
```

Expected: 三条命令均以退出码 0 完成。

- [ ] **Step 2: Recheck asset paths and workflow syntax**

Run:

```bash
! rg '(href|src)="/assets/' dist/build/h5/index.html
ruby -e "require 'yaml'; YAML.parse_file('.github/workflows/deploy-pages.yml'); puts 'workflow YAML parsed'"
git diff --check main...HEAD
```

Expected: 根路径资源检查无匹配；Ruby 输出 `workflow YAML parsed`；Git diff 无空白错误。

- [ ] **Step 3: Review the complete branch diff and commits**

Run:

```bash
git diff --stat main...HEAD
git diff main...HEAD -- vite.config.ts .github/workflows/deploy-pages.yml
git log --oneline main..HEAD
git status --short --branch
```

Expected: 分支仅包含设计文档、实施计划、Vite base 和 Pages workflow；工作区干净，未产生意外文件。
