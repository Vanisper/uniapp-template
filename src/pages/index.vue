<!-- eslint-disable no-console -->
<script setup lang="ts">
import Demo from '@/pages-lib/components/Demo.vue'

defineOptions({
  componentPlaceholder: {
    Demo: 'view',
  },
})

definePage({
  tabBar: {
    text: '首页',
    index: -1,
  },
  style: {
    navigationBarTitleText: '首页',
    navigationStyle: 'custom',
  },
})

usePageShowProvider()

const receiver = useExposeReceiver<ComponentExposed<typeof Demo>>()

onShow(async () => {
  const demo = await useRefReady(() => receiver.ref.value)
  console.log('[parent] 子组件返回:', demo.test('from parent'))
})

function goDemo() {
  uni.navigateTo({
    url: '/pages-demo/index',
  })
}
</script>

<template>
  <Demo :expose="receiver" />
  <view h-60vh bg-amber>
    11
  </view>
  <button @click="goDemo">
    goDemo
  </button>
  <view h-60vh bg-blue>
    22
  </view>
  <text>33</text>
</template>
