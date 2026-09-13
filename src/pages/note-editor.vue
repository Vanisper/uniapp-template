<script setup lang="ts">
import NoteEditor from '@/features/journal/components/NoteEditor.vue'

definePage({ style: { navigationBarTitleText: '写一页', navigationStyle: 'custom' } })
</script>

<template>
  <NoteEditor />
</template>
