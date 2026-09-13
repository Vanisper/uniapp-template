<script setup lang="ts">
import { computed } from 'vue'
import StoryCard from '@/features/journal/components/StoryCard.vue'
import { stories } from '@/features/journal/data'
import { useJournal } from '@/features/journal/useJournal'

definePage({ style: { navigationBarTitleText: '我的收藏', navigationStyle: 'custom' } })
const { savedStoryIds } = useJournal()
const { go } = usePages()
const saved = computed(() => stories.filter(story => savedStoryIds.value.includes(story.id)))
</script>

<template>
  <scroll-view scroll-y class="journal-scroll" :show-scrollbar="false">
    <view class="journal-body">
      <text class="journal-kicker">KEEP WHAT YOU LOVE</text>
      <text class="journal-title">留给下一次阅读</text>
      <view class="journal-section-heading"><text class="journal-muted">共 {{ saved.length }} 篇 · 保存在此设备</text></view>
      <StoryCard v-for="story in saved" :key="story.id" :story="story" @open="go(`/pages/story?id=${$event}`)" />
      <view v-if="!saved.length" class="journal-empty">还没有收藏。读到喜欢的文章时，点一下「收藏这篇文章」。</view>
      <button v-if="!saved.length" class="journal-primary" @click="go('/pages/index', true)">去发现好内容</button>
    </view>
  </scroll-view>
</template>
