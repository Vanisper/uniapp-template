<script setup lang="ts">
import PagingStatesView from '../components/paging/PagingStatesView.vue'

definePage({
  layout: 'default',
  style: {
    navigationBarTitleText: '空态与重试',
    navigationStyle: 'custom',
    disableScroll: true,
  },
})
</script>

<template>
  <PagingStatesView />
</template>
