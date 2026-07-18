<!-- eslint-disable no-console -->
<script setup lang="ts">
import type { PageShowSignal } from '@/composables/usePageShowSignal'
import { usePageShowSignalEffect } from '@/composables/usePageShowSignal'

const props = defineProps<{
  signal: PageShowSignal
}>()

usePageShowSignalEffect(
  () => props.signal,
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
