<!-- eslint-disable no-console -->
<script setup lang="ts">
useOnPageShow(async () => {
  console.log('[sub] 页面显示了，子组件此消息响应一次')
}, { once: true })

useOnPageShow(() => {
  console.log('[sub] 页面显示了，子组件做点什么')
})

function test(msg?: string) {
  return msg
}

defineExpose({ test })
</script>

<template>
  <view>demo</view>
</template>
