<script lang="ts" setup>
definePage({
  layout: 'home',
})

const { value: name } = useQuery('name')

function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view>{{ name }}</view>
  <HiCounter />
  <button @click="goBack">
    goBack
  </button>
</template>
