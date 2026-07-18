<!-- eslint-disable no-console -->
<script setup lang="ts">
useOnPageShow(
  () => {
    console.log(222)
  },
  // { once: true },
)

function test(msg?: string) {
  return msg
}

defineExpose({ test })
</script>

<template>
  <view>demo</view>
</template>
