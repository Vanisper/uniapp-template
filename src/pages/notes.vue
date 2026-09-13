<script setup lang="ts">
import NotebookView from '@/features/journal/components/NotebookView.vue'

definePage({
  layout: 'default',
  tabBar: {
    text: '笔记',
    index: 1,
    iconPath: 'static/tabbar/notes.png',
    selectedIconPath: 'static/tabbar/notes-active.png',
  },
  style: {
    navigationBarTitleText: '我的笔记',
    navigationStyle: 'default',
  },
})
</script>

<template>
  <NotebookView />
</template>
