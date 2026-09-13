<script setup lang="ts">
import RequestDemoView from '../components/request/RequestDemoView.vue'

definePage({
  layout: 'default',
  style: {
    navigationBarTitleText: '请求与 Mock',
    navigationStyle: 'custom',
  },
})
</script>

<template>
  <RequestDemoView />
</template>
