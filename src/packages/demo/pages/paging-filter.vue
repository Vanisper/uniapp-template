<script setup lang="ts">
import PagingFilterView from '../components/paging/PagingFilterView.vue'

definePage({
  layout: 'default',
  style: {
    navigationBarTitleText: '搜索与分类',
    navigationStyle: 'custom',
    disableScroll: true,
  },
})
</script>

<template>
  <PagingFilterView />
</template>
