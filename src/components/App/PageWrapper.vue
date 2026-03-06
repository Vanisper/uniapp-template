<script lang="ts" setup>
import { useLayout } from '@/composables/useLayout'

const { pageWrapperStyle } = useLayout()
</script>

<template>
  <div class="page-wrapper" :style="pageWrapperStyle">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .page-wrapper {
    --page-root-height: calc(100vh - var(--window-top) - var(--window-bottom));

    height: calc(var(--page-root-height) - env(safe-area-inset-bottom) - env(safe-area-inset-top));
    box-sizing: border-box;
    background: #f9f9f9;

    position: relative;
    display: flex;
    flex-direction: column;
  }
</style>
