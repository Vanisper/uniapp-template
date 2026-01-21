<script setup lang="ts">
definePage({
  tabBar: {
    text: '首页',
    index: -1,
  },
  style: {
    navigationBarTitleText: '首页',
  },
})

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
