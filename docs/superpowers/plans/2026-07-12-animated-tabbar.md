# Animated TabBar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有自定义 TabBar 中增加全端可用的滑动胶囊指示器、文字上浮动画和可验证的切换行为

**Architecture:** `currentPage.route` 继续作为唯一选中状态，由两个布局传入通用 `Tabbar` 组件。组件内部从列表和值派生活动索引和指示器样式，只通过原有 `change` 事件请求导航；Vitest 使用独立 Vue 转换配置验证公开渲染结果和事件，不加载完整 uni-app 构建插件链。

**Tech Stack:** Vue 3.4、TypeScript、uni-app、Vue Test Utils、Vitest 2、happy-dom、SCSS、pnpm

## Global Constraints

- 不新增第三方动画库
- H5、App 与各类小程序使用相同的基础 `transform`、`opacity` 和颜色动画
- 动画时长固定为 260ms，缓动使用 ease-out 曲线
- 保留 `list`、`defaultValue`、`valueField`、`textField`、`height`、`color`、`activeColor` 和 `change` 事件契约
- 页面路由是活动标签的唯一事实来源，布局层不维护活动索引
- 点击活动项不触发重复导航，空列表不展示指示器
- H5 端通过 `prefers-reduced-motion` 关闭过渡

---

### Task 1: 建立 TabBar 组件测试并证明现有行为缺口

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `vitest.config.ts`
- Create: `src/components/Tabbar/index.test.ts`

**Interfaces:**
- Consumes: `Tabbar` 现有 props 与 `change: [{ value, text }, item]` 事件
- Produces: `pnpm test` 单次测试命令，以及对 `.tabbar__indicator`、`.tabbar__item--active` 和点击事件的黑盒行为约束

- [ ] **Step 1: 安装与当前 Node 18、Vite 5 兼容的测试依赖**

Run:

```bash
pnpm add -D vitest@^2.1.9 @vue/test-utils@^2.4.6 happy-dom@^15.11.7 @vitejs/plugin-vue@^5.2.4
```

Expected: `package.json` 新增四个 devDependencies，`pnpm-lock.yaml` 更新且安装成功。

- [ ] **Step 2: 增加单次测试脚本和独立 Vitest 配置**

在 `package.json` 的 `scripts` 中加入：

```json
"test": "vitest run"
```

创建 `vitest.config.ts`：

```ts
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: 写入公开行为测试**

创建 `src/components/Tabbar/index.test.ts`：

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Tabbar from './index.vue'

const list = [
  { text: '首页', pagePath: 'pages/index' },
  { text: '关于', pagePath: 'pages/about' },
]

function mountTabbar(defaultValue?: string | number, items = list) {
  return mount(Tabbar, {
    props: {
      activeColor: '#0165ff',
      color: '#8c8c8c',
      defaultValue,
      height: 50,
      list: items,
      textField: 'text',
      valueField: 'pagePath',
    },
    global: {
      stubs: {
        text: { template: '<span><slot /></span>' },
        view: { template: '<div><slot /></div>' },
      },
    },
  })
}

describe('Tabbar', () => {
  it('根据字符串值移动指示器并激活对应标签', () => {
    const wrapper = mountTabbar('pages/about')

    expect(wrapper.find('.tabbar__indicator').attributes('style')).toContain('translateX(100%)')
    expect(wrapper.findAll('.tabbar__item')[1].classes()).toContain('tabbar__item--active')
  })

  it('支持数字索引并在无效值时回退到首项', () => {
    const selected = mountTabbar(1)
    const fallback = mountTabbar('pages/missing')

    expect(selected.findAll('.tabbar__item')[1].classes()).toContain('tabbar__item--active')
    expect(fallback.findAll('.tabbar__item')[0].classes()).toContain('tabbar__item--active')
  })

  it('点击非活动项只发出一次结构正确的 change 事件', async () => {
    const wrapper = mountTabbar('pages/index')
    await wrapper.findAll('.tabbar__item')[1].trigger('click')

    expect(wrapper.emitted('change')).toEqual([[
      { text: '关于', value: 'pages/about' },
      list[1],
    ]])
  })

  it('点击活动项不重复发出 change 事件', async () => {
    const wrapper = mountTabbar('pages/index')
    await wrapper.findAll('.tabbar__item')[0].trigger('click')

    expect(wrapper.emitted('change')).toBeUndefined()
  })

  it('空列表不渲染活动指示器', () => {
    const wrapper = mountTabbar(undefined, [])

    expect(wrapper.find('.tabbar__indicator').exists()).toBe(false)
    expect(wrapper.findAll('.tabbar__item')).toHaveLength(0)
  })
})
```

- [ ] **Step 4: 运行测试并确认因功能未实现而失败**

Run:

```bash
pnpm test -- src/components/Tabbar/index.test.ts
```

Expected: FAIL；`.tabbar__indicator` 或 `.tabbar__item` 查询为空，证明测试覆盖的是尚未实现的动画公开行为。

- [ ] **Step 5: 提交测试基线**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/components/Tabbar/index.test.ts
git commit -m "test(tabbar): 补充组件交互测试"
```

---

### Task 2: 实现滑动胶囊与标签状态动画

**Files:**
- Modify: `src/components/Tabbar/index.vue`
- Test: `src/components/Tabbar/index.test.ts`

**Interfaces:**
- Consumes: Task 1 对 CSS 类、活动状态、回退行为和 `change` 事件的测试契约
- Produces: `currentIndex: ComputedRef<number>`、`indicatorStyle: ComputedRef<Record<string, string>>` 的内部派生结果，以及保持不变的公开 props/emits 契约

- [ ] **Step 1: 用显式 Vue 导入和派生索引替换当前选择逻辑**

在 `<script setup>` 顶部导入 `computed`，并使用以下内部状态：

```ts
import { computed } from 'vue'

const currentIndex = computed(() => {
  const list = props.list
  if (!list?.length) {
    return -1
  }

  const value = props.defaultValue
  if (typeof value === 'number') {
    return value >= 0 && value < list.length ? value : 0
  }

  if (typeof value === 'string') {
    const index = list.findIndex(item => item[props.valueField] === value)
    return index >= 0 ? index : 0
  }

  return 0
})

const current = computed(() => {
  const index = currentIndex.value
  return index >= 0 ? props.list?.[index] : undefined
})

const indicatorStyle = computed(() => {
  const count = props.list?.length ?? 0
  if (!count || currentIndex.value < 0) {
    return {}
  }

  return {
    opacity: '1',
    transform: `translateX(${currentIndex.value * 100}%)`,
    width: `${100 / count}%`,
  }
})
```

将点击处理改为活动项短路：

```ts
function handler(params: I) {
  if (isActive(params)) {
    return
  }

  emit('change', { value: params[props.valueField], text: params[props.textField] }, params)
}
```

- [ ] **Step 2: 替换模板为固定尺寸、稳定键值和动画层**

```vue
<template>
  <view class="tabbar-placeholder" :style="{ height: `${height}px` }" />
  <view class="tabbar" :style="{ height: `${height}px` }">
    <view
      v-if="list?.length"
      class="tabbar__indicator"
      :style="indicatorStyle"
    >
      <view class="tabbar__indicator-surface" />
    </view>

    <view
      v-for="(item, index) in list"
      :key="String(item[valueField] ?? index)"
      class="tabbar__item"
      :class="{ 'tabbar__item--active': isActive(item) }"
      :style="{ color: isActive(item) ? activeColor : color }"
      @click="handler(item)"
    >
      <text class="tabbar__label">
        {{ item[textField] }}
      </text>
    </view>
  </view>
</template>
```

- [ ] **Step 3: 增加跨端稳定的局部样式和 H5 减少动态效果降级**

```scss
<style scoped lang="scss">
.tabbar-placeholder {
  flex-shrink: 0;
}

.tabbar {
  position: absolute;
  z-index: 1;
  bottom: 0;
  left: 0;
  display: flex;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.tabbar__indicator {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  box-sizing: border-box;
  padding: 0 6px;
  pointer-events: none;
  opacity: 0;
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease-out;
}

.tabbar__indicator-surface {
  width: 100%;
  height: 100%;
  background: rgba(1, 101, 255, 0.1);
  border-radius: 8px;
}

.tabbar__item {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  min-width: 0;
  font-size: 12px;
}

.tabbar__label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms ease-out;
}

.tabbar__item--active .tabbar__label {
  transform: translateY(-2px);
}

/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  .tabbar__indicator,
  .tabbar__label {
    transition-duration: 0.01ms;
  }
}
/* #endif */
</style>
```

- [ ] **Step 4: 运行定向测试并确认通过**

Run:

```bash
pnpm test -- src/components/Tabbar/index.test.ts
```

Expected: PASS，5 tests passed。

- [ ] **Step 5: 运行类型检查并提交实现**

Run:

```bash
pnpm type-check
```

Expected: exit 0。

```bash
git add src/components/Tabbar/index.vue
git commit -m "feat(tabbar): 实现滑动胶囊动画"
```

---

### Task 3: 完成工程构建与浏览器验收

**Files:**
- Modify only if verification reveals a feature-scoped defect: `src/components/Tabbar/index.vue`, `src/components/Tabbar/index.test.ts`, `vitest.config.ts`

**Interfaces:**
- Consumes: Task 2 已通过的组件行为和样式
- Produces: H5 构建产物、桌面与移动视口的交互证据，以及功能分支最终提交状态

- [ ] **Step 1: 运行全量功能验证**

Run:

```bash
pnpm test
pnpm type-check
pnpm build
```

Expected: 三条命令均 exit 0。

- [ ] **Step 2: 复现并记录既有 ESLint 基线问题**

Run:

```bash
pnpm lint
```

Expected under Node 18.20.8: ESLint 9.39.2 在加载 `@uni-helper/eslint-config` 时以 `SyntaxError: Invalid regular expression flags` 退出；除非新代码产生了可单独定位的 lint 问题，否则不在本功能中修改工具链。

- [ ] **Step 3: 启动 H5 开发服务器并验证桌面视口**

Run:

```bash
pnpm dev -- --host 127.0.0.1
```

在浏览器中打开实际端口，验证：

- 首页首项处于激活状态，胶囊位于左半区域
- 点击“关于”后路由切换，胶囊移动到右半区域
- 标签栏高度、内容区域和页面滚动不发生跳动

- [ ] **Step 4: 验证移动视口和减少动态效果**

使用 390×844 视口重复切换，确认文本无溢出、底栏无遮挡。启用 `prefers-reduced-motion: reduce` 后确认切换仍工作且过渡时长接近零。

- [ ] **Step 5: 检查最终差异与工作区**

Run:

```bash
git diff main...HEAD --check
git diff main...HEAD --stat
git status --short --branch
```

Expected: 无空白错误；差异只包含规格、计划、测试配置、依赖和 TabBar 实现；工作区干净。

