<script lang="ts" setup>
import AppPageTabbar from '@/components/App/PageTabbar.vue'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})
</script>

<template>
  <slot />
  <AppPageTabbar />
</template>
