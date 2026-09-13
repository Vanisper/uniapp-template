<script setup lang="ts">
import type { PagingArticle } from './data'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

defineProps<{
  article: PagingArticle
}>()
</script>

<template>
  <view class="article-card">
    <view class="article-meta">
      <text class="article-category">{{ article.category }}</text>
      <text class="article-number">{{ String(article.id).padStart(2, '0') }} / {{ article.minutes }} 分钟阅读</text>
    </view>
    <view class="article-title">{{ article.title }}</view>
    <view class="article-summary">{{ article.summary }}</view>
  </view>
</template>

<style scoped>
.article-card { margin-bottom: 12px; padding: 17px 18px; border: 1px solid #e4e9e1; border-radius: 16px; background: #fff; }
.article-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.article-category { color: #257864; font-size: 11px; }
.article-number { color: #9aa29b; font-size: 10px; font-variant-numeric: tabular-nums; }
.article-title { margin-top: 12px; color: #27312b; font-size: 16px; font-weight: 500; line-height: 1.45; }
.article-summary { margin-top: 7px; color: #828a82; font-size: 12px; line-height: 1.65; }
</style>
