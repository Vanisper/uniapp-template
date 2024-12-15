<script lang="ts" setup>
import { navigateTo } from '@/utils'
</script>

<template>
  <view class="page-container">
    <text class="block h1 text-center">
      子包1
    </text>

    <button @click="navigateTo('/pages/index')">
      回到首页
    </button>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  height: 100vh;
  padding-left: 40px;
  padding-right: 40px;

  .block {
    display: block;
    box-sizing: border-box;
  }

  .text-center {
    text-align: center;
  }

  .h1 {
    font-size: 2rem;
    font-weight: bold;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
}
</style>
