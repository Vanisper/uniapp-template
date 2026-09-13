<script lang="ts" setup>
import { useLayout } from '@/composables/useLayout'

const { hasNavbar, hasNativeTabbar, pageWrapperStyle } = useLayout()
</script>

<template>
  <div
    class="page-wrapper"
    :class="{
      'page-wrapper--custom-navigation': hasNavbar,
      'page-wrapper--native-tabbar': hasNativeTabbar,
    }"
    :style="pageWrapperStyle"
  >
    <slot />
  </div>
</template>

<style lang="scss" scoped>
  .page-wrapper {
    --page-viewport-height: 100vh;
    --page-top: var(--window-top, 0px);
    --page-bottom: calc(var(--window-bottom, 0px) + env(safe-area-inset-bottom, 0px));

    /* #ifdef H5 */
    // H5 的窗口偏移已包含安全区
    --page-bottom: var(--window-bottom, 0px);
    /* #endif */

    height: calc(var(--page-viewport-height) - var(--page-top) - var(--page-bottom));
    box-sizing: border-box;
    background: var(--app-bg, #f5f6f3);

    position: relative;
    display: flex;
    flex-direction: column;
  }

  .page-wrapper--custom-navigation {
    // 自定义状态栏在容器内部占位
    --page-top: 0px;
  }

  .page-wrapper--native-tabbar {
    // 原生底栏的安全区已由平台或窗口偏移预留
    --page-bottom: var(--window-bottom, 0px);
  }

  /* #ifdef H5 */
  @supports (height: 100dvh) {
    .page-wrapper {
      --page-viewport-height: 100dvh;
    }
  }
  /* #endif */
</style>
