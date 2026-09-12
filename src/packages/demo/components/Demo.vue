<!-- eslint-disable no-console -->
<script setup lang="ts">
const props = defineProps<{
  expose?: ExposeReceiver<any>
}>()

useMixedOnShow(async () => {
  console.log('[sub] 页面显示了，子组件此消息响应一次')
}, { once: true })

useMixedOnShow(() => {
  console.log('[sub] 页面显示了，子组件做点什么')
})

function test(msg?: string) {
  return msg
}

const exposed = { test }
useExpose(props.expose, exposed)
defineExpose(exposed)
</script>

<template>
  <view text-center m-3 p-3 b b-solid b-blue>demo</view>
</template>
