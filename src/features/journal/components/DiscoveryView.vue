<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { usePages } from '@/composables/usePages'
import { stories } from '../data'
import JournalHeader from './JournalHeader.vue'
import StoryCard from './StoryCard.vue'

defineOptions({ options: { virtualHost: true, styleIsolation: 'shared' } })
const { go } = usePages()
const activeTab = shallowRef('精选')
const search = shallowRef('')
const filtered = computed(() => stories.filter(story =>
  (activeTab.value === '精选' || story.category === activeTab.value)
  && `${story.title}${story.summary}`.includes(search.value.trim()),
))
function openStory(id: string) {
  void go(`/pages/story?id=${id}`)
}
</script>

<template>
  <view class="journal-screen">
    <JournalHeader v-model="activeTab" :tabs="['精选', '灵感', '城市']" @profile="go('/pages/about', true)" />
    <scroll-view scroll-y class="journal-scroll" :show-scrollbar="false">
      <view class="journal-body discovery-body">
        <view class="discovery-intro">
          <view><text class="journal-kicker">A LITTLE EVERY DAY</text><text class="journal-title">发现日常里的美好</text></view>
          <view class="discovery-date"><text class="i-carbon-sun" /><text>慢慢来，也很好</text></view>
        </view>
        <view class="journal-search"><text class="i-carbon-search" /><input v-model="search" placeholder="搜索感兴趣的内容" aria-label="搜索发现内容" confirm-type="search"></view>
        <view class="journal-section-heading"><text class="journal-section-title">{{ search ? '搜索结果' : activeTab === '精选' ? '今日推荐' : `${activeTab}发现` }}</text><text class="journal-muted">{{ filtered.length }} 篇精选</text></view>
        <StoryCard v-for="(story, index) in filtered" :key="story.id" :story="story" :featured="index === 0" @open="openStory" />
        <view v-if="!filtered.length" class="journal-empty">还没有找到相关内容，换一个关键词试试。</view>
        <view class="discovery-note" @click="go('/pages/note-editor')"><view><text class="discovery-note__title">今天，有什么想记下来？</text><text class="journal-muted">让每一个微小的灵感，都有地方安放。</text></view><button class="discovery-note__button" aria-label="新建笔记"><text class="i-carbon-add" /></button></view>
        <view class="discovery-footer"><text>拾页 · 把日常写成自己的故事</text><button class="journal-link" @click="go('/packages/demo/pages/index')">进入测试中心 <text class="i-carbon-arrow-right" /></button></view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.discovery-body { padding-top: 25px; }
.discovery-intro { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
.discovery-intro .journal-title { font-size: 25px; }
.discovery-date { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; padding-top: 7px; color: #9da78e; font-size: 9px; }
.discovery-date .i-carbon-sun { color: #bdaa78; font-size: 25px; }
.discovery-note { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 22px; padding: 20px 17px; border: 1px solid #dce6da; border-radius: 14px; background: #edf2e9; }
.discovery-note__title { display: block; margin-bottom: 5px; color: #436443; font-size: 14px; font-weight: 600; }
.discovery-note__button { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 38px; height: 38px; padding: 0; border-radius: 50%; background: #fff; color: #54784d; font-size: 20px; }
.discovery-footer { display: flex; flex-direction: column; align-items: center; gap: 8px; padding-top: 30px; color: #a2aaa3; font-size: 10px; }
@media (max-width: 360px) { .discovery-intro .journal-title { font-size: 22px; } .discovery-date { display: none; } }
</style>
