<script setup lang="ts">
defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

defineProps<{
  number: string
  title: string
  description: string
}>()
</script>

<template>
  <view class="paging-intro">
    <view class="paging-eyebrow">Z-PAGING / {{ number }}</view>
    <view class="paging-title">{{ title }}</view>
    <view class="paging-description">{{ description }}</view>
    <view class="paging-source"><text class="source-dot" />本地模拟数据 · 延迟 500ms</view>
  </view>
</template>

<style scoped>
.paging-intro { flex: none; padding: var(--paging-intro-top) var(--paging-gutter) var(--paging-intro-bottom); }
.paging-eyebrow { display: var(--paging-eyebrow-display, block); color: #257864; font-size: 10px; font-weight: 600; letter-spacing: 2px; }
.paging-title { margin-top: var(--paging-title-gap); color: #202824; font-size: var(--paging-title-size); font-weight: 600; line-height: 1.3; }
.paging-description { display: var(--paging-description-display, block); margin-top: var(--paging-description-gap); color: #737d75; font-size: var(--paging-description-size); line-height: 1.65; }
.paging-source { display: flex; align-items: center; gap: 6px; margin-top: var(--paging-source-gap); color: #849087; font-size: 11px; }
.source-dot { width: 5px; height: 5px; border-radius: 50%; background: #7e9e88; }
</style>
