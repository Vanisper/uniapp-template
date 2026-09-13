<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { noteCategories } from '../data'
import { useJournal } from '../useJournal'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const { notes } = useJournal()
const search = shallowRef('')
const category = shallowRef<typeof noteCategories[number]>('全部')
const visibleNotes = computed(() => {
  const query = search.value.trim().toLowerCase()
  return notes.value.filter(note =>
    (category.value === '全部' || note.category === category.value)
    && (!query || `${note.title} ${note.content}`.toLowerCase().includes(query)),
  )
})

function openNote(id?: string) {
  uni.navigateTo({ url: id ? `/pages/note-editor?id=${encodeURIComponent(id)}` : '/pages/note-editor' })
}

function resetFilters() {
  search.value = ''
  category.value = '全部'
}
</script>

<template>
  <scroll-view scroll-y class="notebook-scroll" :show-scrollbar="false">
    <view class="journal-body notebook-body">
      <view class="notebook-heading">
        <view>
          <text class="journal-kicker">MY NOTEBOOK</text>
          <text class="journal-title notebook-title">留住每个好想法</text>
          <text class="journal-muted notebook-subtitle">{{ notes.length }} 篇笔记 · 保存在此设备</text>
        </view>
        <button class="notebook-add" aria-label="新建笔记" @click="openNote()">
          <view i-carbon:add />
        </button>
      </view>

      <view class="journal-search notebook-search">
        <view i-carbon:search />
        <input v-model="search" placeholder="找一找记下的灵感" confirm-type="search" aria-label="搜索笔记">
        <button v-if="search" class="notebook-clear" aria-label="清空搜索" @click="search = ''">
          <view i-carbon:close />
        </button>
      </view>

      <view class="journal-chips">
        <button
          v-for="item in noteCategories"
          :key="item"
          class="journal-chip"
          :class="{ 'journal-chip--active': category === item }"
          @click="category = item"
        >
          {{ item }}
        </button>
      </view>

      <view class="notebook-list-heading">
        <text>{{ search.trim() ? '搜索结果' : category === '全部' ? '全部笔记' : `${category}笔记` }}</text>
        <text class="notebook-count">{{ visibleNotes.length }} 篇</text>
      </view>

      <view v-if="visibleNotes.length" class="notebook-list">
        <button v-for="note in visibleNotes" :key="note.id" class="notebook-card" @click="openNote(note.id)">
          <view class="notebook-card-meta">
            <text class="notebook-category" :class="{ 'notebook-category--life': note.category === '生活', 'notebook-category--city': note.category === '城市' }">{{ note.category }}</text>
            <text class="notebook-date">{{ note.updatedAt.replaceAll('-', '.') }}</text>
          </view>
          <text class="notebook-card-title">{{ note.title }}</text>
          <text class="notebook-card-content">{{ note.content }}</text>
          <view class="notebook-card-footer">
            <text>继续记录</text>
            <view i-carbon:arrow-up-right />
          </view>
        </button>
      </view>

      <view v-else class="journal-empty notebook-empty">
        <view class="notebook-empty-icon" i-carbon:notebook />
        <text class="notebook-empty-title">{{ notes.length ? '还没有找到这条灵感' : '从第一句话开始' }}</text>
        <text>{{ notes.length ? '换个关键词，或看看其他分类。' : '写下一个念头，留给以后的自己。' }}</text>
        <button v-if="notes.length" class="journal-link notebook-empty-action" @click="resetFilters">查看全部笔记</button>
        <button v-else class="journal-link notebook-empty-action" @click="openNote()">写一篇笔记</button>
      </view>

      <view v-if="visibleNotes.length" class="notebook-bottom">
        <view class="notebook-bottom-line" />
        <text>每一页，都是日常的回声</text>
        <view class="notebook-bottom-line" />
      </view>
    </view>
  </scroll-view>
</template>

<style scoped>
.notebook-scroll { height: 100%; background: var(--app-bg); }
.notebook-body { padding-top: 28px; }
.notebook-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.notebook-title { font-size: 25px; }
.notebook-subtitle { display: block; margin-top: 9px; }
.notebook-add { display: flex; flex-shrink: 0; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0; border-radius: 14px; color: #fff; background: var(--app-green); font-size: 25px; }
.notebook-search { margin-top: 26px; }
.notebook-clear { display: flex; align-items: center; justify-content: center; width: 24px; height: 28px; padding: 0; color: var(--app-muted); background: transparent; font-size: 16px; }
.notebook-list-heading { display: flex; align-items: center; justify-content: space-between; margin: 26px 0 14px; font-size: 15px; font-weight: 600; }
.notebook-count { color: var(--app-muted); font-size: 11px; font-weight: 400; }
.notebook-list { display: flex; flex-direction: column; gap: 13px; }
.notebook-card { width: 100%; box-sizing: border-box; padding: 19px; border: 1px solid var(--app-line); border-radius: 17px; color: var(--app-ink); background: var(--app-surface); text-align: left; }
.notebook-card-meta { display: flex; align-items: center; justify-content: space-between; }
.notebook-category { padding: 4px 8px; border-radius: 5px; color: #54806a; background: #f0f5ee; font-size: 10px; }
.notebook-category--life { color: #aa785b; background: #faf1e9; }
.notebook-category--city { color: #677e8c; background: #edf2f5; }
.notebook-date { color: var(--app-muted); font-size: 10px; letter-spacing: 0.5px; }
.notebook-card-title { display: block; margin-top: 15px; font-size: 17px; font-weight: 600; line-height: 1.6; }
.notebook-card-content { display: -webkit-box; overflow: hidden; margin-top: 7px; color: #7a857d; font-size: 13px; line-height: 1.85; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.notebook-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 19px; padding-top: 12px; border-top: 1px solid #f0f2ed; color: #8d9790; font-size: 10px; }
.notebook-card-footer > view { color: var(--app-green); font-size: 16px; }
.notebook-empty { display: flex; flex-direction: column; align-items: center; }
.notebook-empty-icon { width: 35px; height: 35px; margin-bottom: 17px; color: #a2b4a8; }
.notebook-empty-title { margin-bottom: 5px; color: var(--app-ink); font-size: 16px; }
.notebook-empty-action { margin-top: 15px; }
.notebook-bottom { display: flex; align-items: center; justify-content: center; gap: 11px; margin: 29px 0 3px; color: #a5ada6; font-size: 10px; }
.notebook-bottom-line { width: 20px; height: 1px; background: #d9dfd8; }
</style>
