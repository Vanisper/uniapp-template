<script setup lang="ts">
function goDemo() {
  uni.navigateTo({
    url: '/pages-demo/index',
  })
}
</script>

<template>
  <button @click="goDemo">
    goDemo
  </button>
</template>
