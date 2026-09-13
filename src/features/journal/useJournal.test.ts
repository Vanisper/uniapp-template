import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function createStorage() {
  const values = new Map<string, string>()
  const getStorageSync = vi.fn((key: string) => {
    const saved = values.get(key)
    return saved === undefined ? '' : JSON.parse(saved)
  })
  const setStorageSync = vi.fn((key: string, value: unknown) => {
    values.set(key, JSON.stringify(value))
  })
  vi.stubGlobal('uni', { getStorageSync, setStorageSync })
  return { getStorageSync, setStorageSync }
}

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 13, 12))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('useJournal', () => {
  it('新建笔记放在列表首位，保留已有内容并立即保存', async () => {
    const { setStorageSync } = createStorage()
    const { useJournal } = await import('./useJournal')
    const journal = useJournal()
    const existingNotes = [...journal.notes.value]
    const note = { title: '河边的下午', content: '把今天看到的光记下来。', category: '生活' as const }

    const id = journal.saveNote(note)

    expect(id).toEqual(expect.any(String))
    expect(id.length).toBeGreaterThan(0)
    expect(journal.notes.value[0]).toEqual({ ...note, id, updatedAt: '2026-09-13' })
    expect(journal.notes.value.slice(1)).toEqual(existingNotes)
    expect(setStorageSync).toHaveBeenLastCalledWith('journal-content-v1', {
      notes: journal.notes.value,
      savedStoryIds: [],
    })
  })

  it('编辑指定笔记更新内容和日期，同一标识只保留一条记录', async () => {
    const { setStorageSync } = createStorage()
    const { useJournal } = await import('./useJournal')
    const journal = useJournal()
    const original = journal.notes.value[1]!
    const originalCount = journal.notes.value.length
    const others = journal.notes.value.filter(note => note.id !== original.id)

    const id = journal.saveNote({ ...original, title: '新的城市路线', content: '下次从河边出发。' })

    expect(id).toBe(original.id)
    expect(journal.notes.value).toHaveLength(originalCount)
    expect(journal.notes.value.filter(note => note.id === id)).toEqual([{
      ...original,
      title: '新的城市路线',
      content: '下次从河边出发。',
      updatedAt: '2026-09-13',
    }])
    expect(journal.notes.value[0]?.id).toBe(id)
    expect(journal.notes.value.slice(1)).toEqual(others)
    expect(setStorageSync).toHaveBeenLastCalledWith('journal-content-v1', {
      notes: journal.notes.value,
      savedStoryIds: [],
    })
  })

  it('再次收藏同一篇内容会取消收藏，并保留其他收藏', async () => {
    const { setStorageSync } = createStorage()
    const { useJournal } = await import('./useJournal')
    const journal = useJournal()

    journal.toggleSaved('bookshop')
    expect(journal.savedStoryIds.value).toEqual(['bookshop'])
    journal.toggleSaved('weekend')
    expect(journal.savedStoryIds.value).toEqual(['bookshop', 'weekend'])
    journal.toggleSaved('bookshop')

    expect(journal.savedStoryIds.value).toEqual(['weekend'])
    expect(setStorageSync).toHaveBeenLastCalledWith('journal-content-v1', {
      notes: journal.notes.value,
      savedStoryIds: ['weekend'],
    })
  })

  it('新模块实例从同一设备存储恢复保存的笔记与收藏', async () => {
    const { getStorageSync } = createStorage()
    const { useJournal } = await import('./useJournal')
    const journal = useJournal()
    const id = journal.saveNote({ title: '周末片段', content: '去一家没去过的书店。', category: '城市' })
    journal.toggleSaved('bookshop')
    const savedNotes = JSON.parse(JSON.stringify(journal.notes.value))

    vi.resetModules()
    const { useJournal: useReloadedJournal } = await import('./useJournal')
    const restored = useReloadedJournal()

    expect(restored.notes).not.toBe(journal.notes)
    expect(restored.notes.value).toEqual(savedNotes)
    expect(restored.notes.value[0]?.id).toBe(id)
    expect(restored.savedStoryIds.value).toEqual(['bookshop'])
    expect(getStorageSync).toHaveBeenCalledTimes(2)
    expect(getStorageSync).toHaveBeenLastCalledWith('journal-content-v1')
  })
})
