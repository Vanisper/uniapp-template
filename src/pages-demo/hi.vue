<script lang="ts" setup>
import AppFooter from './components/AppFooter.vue'
import HiCounter from './components/HiCounter.vue'

definePage({
  layout: 'demo',
})

const { value: name } = useQuery('name')
const { goBack } = usePages()
</script>

<template>
  <view>{{ name }}</view>
  <HiCounter />
  <button @click="goBack(true)">
    goBack
  </button>
  <AppFooter />
</template>
