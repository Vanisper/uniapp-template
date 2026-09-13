<script lang="ts" setup>
import AppPageTabbar from '@/components/App/PageTabbar.vue'
import { useLayout } from '@/composables/useLayout'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})
const { hasTabbar, tabbarHeight } = useLayout()
</script>

<template>
  <slot />
  <AppPageTabbar v-if="hasTabbar" :height="tabbarHeight" />
</template>
