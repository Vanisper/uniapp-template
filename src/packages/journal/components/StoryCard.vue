<script setup lang="ts">
import type { Story } from '../data'

defineOptions({ options: { virtualHost: true, styleIsolation: 'shared' } })
defineProps<{ story: Story, featured?: boolean }>()
const emit = defineEmits<{ open: [id: string] }>()
</script>

<template>
  <view class="story-card" :class="{ 'story-card--featured': featured }" role="button" :aria-label="`阅读${story.title}`" @click="emit('open', story.id)">
    <view v-if="featured" class="story-card__cover-wrap">
      <image v-if="story.cover" class="story-card__cover" :src="story.cover" mode="aspectFill" />
      <view v-else class="story-card__art" :class="`story-card__art--${story.color}`"><text class="i-carbon-pen" /></view>
      <text class="story-card__cover-label">拾页 · 编辑精选</text>
    </view>
    <view class="story-card__body">
      <view class="story-card__copy">
        <text class="story-card__category">{{ story.category }} · {{ story.minutes }} 分钟阅读</text>
        <text class="story-card__title">{{ story.title }}</text>
        <text class="story-card__summary">{{ story.summary }}</text>
        <view v-if="featured" class="story-card__footer"><text class="story-card__author-mark">拾</text><text>{{ story.author }}</text><text class="story-card__arrow i-carbon-arrow-up-right" /></view>
      </view>
      <view v-if="!featured" class="story-card__small-art" :class="`story-card__art--${story.color}`">
        <text :class="story.category === '灵感' ? 'i-carbon-pen' : 'i-carbon-cafe'" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.story-card { overflow: hidden; margin-bottom: 13px; border: 1px solid var(--app-line); border-radius: 16px; background: var(--app-surface); }
.story-card__cover-wrap { position: relative; height: 202px; }
.story-card__cover { width: 100%; height: 100%; }
.story-card__cover-label { position: absolute; top: 15px; left: 15px; padding: 6px 10px; border: 1px solid #ffffff50; border-radius: 6px; background: #ffffffdc; color: #39473b; font-size: 10px; font-weight: 600; }
.story-card__body { display: flex; align-items: center; gap: 12px; padding: 18px; }
.story-card__copy { flex: 1; min-width: 0; }
.story-card__category { color: var(--app-green); font-size: 10px; font-weight: 500; }
.story-card__title { display: block; margin: 9px 0 7px; font-size: 15px; line-height: 1.5; font-weight: 650; }
.story-card--featured .story-card__title { font-size: 21px; letter-spacing: -0.5px; }
.story-card__summary { display: block; color: #8c948e; font-size: 11px; line-height: 1.9; }
.story-card__footer { display: flex; align-items: center; gap: 7px; margin-top: 18px; padding-top: 15px; border-top: 1px solid var(--app-line); color: #8c948e; font-size: 10px; }
.story-card__author-mark { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #e7eee7; color: #547960; font-size: 10px; }
.story-card__arrow { margin-left: auto; font-size: 17px; color: #485c4d; }
.story-card__small-art { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 69px; height: 80px; border-radius: 11px; font-size: 33px; }
.story-card__art { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 70px; }
.story-card__art--sage { background: #e4ebe0; color: #6c8567; }
.story-card__art--peach { background: #f4e7db; color: #b78c69; }
.story-card__art--sand { background: #ede9dc; color: #9c9777; }
</style>
