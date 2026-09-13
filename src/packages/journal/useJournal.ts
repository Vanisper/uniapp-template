import type { JournalNote } from './data'
import { readonly, shallowRef } from 'vue'
import { initialNotes } from './data'

const storageKey = 'journal-content-v1'
const notes = shallowRef<JournalNote[]>(initialNotes.map(note => ({ ...note })))
const savedStoryIds = shallowRef<string[]>([])
let initialized = false

function persist() {
  uni.setStorageSync(storageKey, { notes: notes.value, savedStoryIds: savedStoryIds.value })
}

/** 管理保存在当前设备上的笔记与收藏 */
export function useJournal() {
  if (!initialized) {
    initialized = true
    const saved = uni.getStorageSync(storageKey)
    if (saved && Array.isArray(saved.notes) && Array.isArray(saved.savedStoryIds)) {
      notes.value = saved.notes
      savedStoryIds.value = saved.savedStoryIds
    }
  }

  function toggleSaved(storyId: string) {
    savedStoryIds.value = savedStoryIds.value.includes(storyId)
      ? savedStoryIds.value.filter(id => id !== storyId)
      : [...savedStoryIds.value, storyId]
    persist()
  }

  /** 保存笔记并返回标识；省略 id 时创建新笔记 */
  function saveNote(note: Omit<JournalNote, 'id' | 'updatedAt'> & { id?: string }) {
    const id = note.id ?? `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const date = new Date()
    const updated: JournalNote = {
      ...note,
      id,
      updatedAt: [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-'),
    }
    notes.value = [updated, ...notes.value.filter(item => item.id !== id)]
    persist()
    return id
  }

  return { notes: readonly(notes), savedStoryIds: readonly(savedStoryIds), toggleSaved, saveNote }
}
