<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@/composables/useQuery'
import { stories } from '../data'
import { useJournal } from '../useJournal'

defineOptions({ options: { virtualHost: true, styleIsolation: 'shared' } })
const { value: id } = useQuery('id')
const story = computed(() => stories.find(item => item.id === id.value) ?? stories[0]!)
const { savedStoryIds, toggleSaved } = useJournal()
const saved = computed(() => savedStoryIds.value.includes(story.value.id))
</script>

<template>
  <scroll-view scroll-y class="journal-scroll" :show-scrollbar="false">
    <view class="journal-body article">
      <text class="journal-kicker">{{ story.category }} / READING</text>
      <text class="article__title">{{ story.title }}</text>
      <view class="article__meta"><text>{{ story.author }}</text><text>{{ story.minutes }} 分钟阅读</text></view>
      <image v-if="story.cover" class="article__cover" :src="story.cover" mode="aspectFill" />
      <text class="article__lead">{{ story.summary }}</text>
      <text v-for="paragraph in story.paragraphs" :key="paragraph" class="article__paragraph">{{ paragraph }}</text>
      <view class="article__end"><text>— 愿你一直保有对日常的好奇 —</text></view>
      <button class="article__save" :class="{ 'article__save--active': saved }" @click="toggleSaved(story.id)"><text :class="saved ? 'i-carbon-bookmark-filled' : 'i-carbon-bookmark'" />{{ saved ? '已加入收藏' : '收藏这篇文章' }}</button>
    </view>
  </scroll-view>
</template>

<style scoped lang="scss">
.article { padding-top: 32px; }
.article__title { display: block; margin: 14px 0; font-size: 29px; font-weight: 700; letter-spacing: -1px; line-height: 1.5; }
.article__meta { display: flex; gap: 16px; margin-bottom: 25px; color: #929b95; font-size: 12px; }
.article__cover { display: block; width: 100%; height: 228px; margin-bottom: 25px; border-radius: 12px; }
.article__lead { display: block; margin: 24px 0; padding-left: 15px; border-left: 3px solid #b4c9ac; color: #7b897b; font-size: 15px; line-height: 1.9; }
.article__paragraph { display: block; margin-bottom: 22px; color: #46534a; font-size: 16px; line-height: 2.05; }
.article__end { padding: 12px 0 30px; color: #a0aaa2; font-size: 11px; text-align: center; }
.article__save { display: flex; align-items: center; justify-content: center; gap: 8px; height: 48px; border: 1px solid #dce6da; border-radius: 12px; background: #edf2e9; color: #54784d; font-size: 14px; }
.article__save--active { color: white; background: #257864; }
</style>
