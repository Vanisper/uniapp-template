<script setup lang="ts">
import PagingBasicView from '../components/paging/PagingBasicView.vue'

definePage({
  layout: 'default',
  style: {
    navigationBarTitleText: '基础分页',
    navigationStyle: 'custom',
    disableScroll: true,
  },
})
</script>

<template>
  <PagingBasicView />
</template>
