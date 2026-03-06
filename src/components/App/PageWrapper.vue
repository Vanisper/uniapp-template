<script lang="ts" setup>
</script>

<template>
  <div class="page-wrapper">
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .page-wrapper {
    // todo: top 与 bottom 需要适配自定义的 navbar、tabbar 高度样式
    --page-root-height: calc(100vh - calc(var(--window-top) + var(--window-bottom)));
    // --page-root-height: calc(100vh - 44px - env(safe-area-inset-top) - var(--tab-bar-height) - env(safe-area-inset-bottom));
    min-height: var(--page-root-height);

    box-sizing: border-box;
    background: #f9f9f9;
  }
</style>
