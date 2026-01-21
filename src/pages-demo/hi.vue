<script lang="ts" setup>
import AppFooter from './components/AppFooter.vue'
import HiCounter from './components/HiCounter.vue'

definePage({
  layout: 'demo',
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
  <AppFooter />
</template>
