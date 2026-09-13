<script setup lang="ts">
import type { PagePath } from '@/composables/usePages'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const { go } = usePages()
const opening = shallowRef(false)
const entries = [
  { path: '/packages/demo/pages/wot', icon: 'i-carbon-color-palette', title: 'Wot UI 组件', description: '表单校验、按钮反馈与确认弹窗', label: 'WOT UI' },
] as const satisfies readonly { path: PagePath, icon: string, title: string, description: string, label: string }[]

async function openExample(path: PagePath) {
  if (opening.value)
    return

  opening.value = true
  const success = await go(path)
  opening.value = false
  if (!success)
    uni.showToast({ title: '页面打开失败，请重试', icon: 'none' })
}
</script>

<template>
  <view class="component-entries">
    <button
      v-for="entry in entries"
      :key="entry.path"
      class="component-entry"
      hover-class="component-entry--pressed"
      :disabled="opening"
      @click="openExample(entry.path)"
    >
      <view class="entry-icon"><text :class="entry.icon" /></view>
      <view class="entry-content">
        <view class="entry-label">{{ entry.label }}</view>
        <view class="entry-title">{{ entry.title }}</view>
        <view class="entry-description">{{ entry.description }}</view>
      </view>
      <text class="entry-arrow" i-carbon-chevron-right />
    </button>
  </view>
</template>

<style scoped>
.component-entries { display: flex; flex-direction: column; gap: 12px; }
.component-entry { box-sizing: border-box; display: flex; align-items: center; gap: 14px; width: 100%; padding: 20px 16px; border: 1px solid #e6eae4; border-radius: 18px; background: #fff; text-align: left; }
.component-entry--pressed { background: #eef5f0; }
.entry-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 42px; height: 42px; border-radius: 12px; background: #eef5f0; color: #257864; font-size: 23px; }
.entry-content { flex: 1; min-width: 0; }
.entry-label { margin-bottom: 7px; color: #7b897e; font-size: 9px; letter-spacing: 1.1px; }
.entry-title { color: #202824; font-size: 16px; font-weight: 600; }
.entry-description { margin-top: 7px; color: #808781; font-size: 12px; line-height: 1.6; }
.entry-arrow { flex-shrink: 0; color: #9aa394; font-size: 16px; }
</style>
