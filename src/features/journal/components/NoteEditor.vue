<script setup lang="ts">
import type { NoteCategory } from '../data'
import { onLoad } from '@dcloudio/uni-app'
import { shallowRef } from 'vue'
import { usePages } from '@/composables/usePages'
import { useJournal } from '../useJournal'

defineOptions({ options: { virtualHost: true, styleIsolation: 'shared' } })
const { notes, saveNote } = useJournal()
const { goBack } = usePages()
const id = shallowRef<string>()
const title = shallowRef('')
const content = shallowRef('')
const category = shallowRef<NoteCategory>('灵感')
const categories: NoteCategory[] = ['灵感', '生活', '城市']
onLoad((query) => {
  const existing = notes.value.find(note => note.id === query?.id)
  if (existing) {
    id.value = existing.id
    title.value = existing.title
    content.value = existing.content
    category.value = existing.category
  }
})
async function save() {
  if (!title.value.trim()) {
    uni.showToast({ title: '先给笔记起个名字吧', icon: 'none' })
    return
  }
  saveNote({ id: id.value, title: title.value.trim(), content: content.value.trim(), category: category.value })
  uni.showToast({ title: '笔记已保存', icon: 'success' })
  await goBack(true)
}
</script>

<template>
  <scroll-view scroll-y class="journal-scroll" :show-scrollbar="false">
    <view class="journal-body editor">
      <view class="editor__intro"><text class="journal-kicker">MAKE ROOM FOR IDEAS</text><text class="journal-muted">不必完整，先写下来。</text></view>
      <input v-model="title" class="editor__title" placeholder="给这一页起个名字" :maxlength="60" aria-label="笔记标题">
      <view class="journal-chips"><button v-for="item in categories" :key="item" class="journal-chip" :class="{ 'journal-chip--active': category === item }" @click="category = item">{{ item }}</button></view>
      <textarea v-model="content" class="editor__content" placeholder="今天有什么值得记录的事？" :maxlength="5000" :show-confirm-bar="false" aria-label="笔记内容" />
      <view class="editor__count"><text>保存在此设备</text><text>{{ content.length }} / 5000</text></view>
      <button class="journal-primary" @click="save">保存笔记 <text class="i-carbon-arrow-right" /></button>
    </view>
  </scroll-view>
</template>

<style scoped lang="scss">
.editor { padding-top: 30px; }
.editor__intro { display: flex; flex-direction: column; gap: 10px; padding-bottom: 30px; }
.editor__title { height: 52px; color: var(--app-ink); font-size: 24px; font-weight: 650; }
.editor__content { display: block; width: 100%; min-height: 280px; box-sizing: border-box; padding: 20px; border: 1px solid var(--app-line); border-radius: 16px; background: var(--app-surface); font-size: 15px; line-height: 1.9; }
.editor__count { display: flex; justify-content: space-between; margin: 14px 0 25px; color: var(--app-muted); font-size: 11px; }
</style>
