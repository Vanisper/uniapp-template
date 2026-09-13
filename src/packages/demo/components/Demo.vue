<script setup lang="ts">
const props = withDefaults(defineProps<{
  expose?: ExposeReceiver<{ test: (message?: string) => string }>
  label?: string
}>(), {
  label: '组件实例',
})

const showCount = shallowRef(0)
const onceCount = shallowRef(0)
const callCount = shallowRef(0)

useMixedOnShow(() => {
  onceCount.value++
}, { once: true })

useMixedOnShow(() => {
  showCount.value++
})

function test(message = '') {
  callCount.value++
  return message
}

const exposed = { test }
useExpose(props.expose, exposed)
defineExpose(exposed)
</script>

<template>
  <view class="demo-instance">
    <view class="instance-heading">
      <text class="instance-label">{{ label }}</text>
      <view class="instance-state"><text class="ready-dot" />已就绪</view>
    </view>
    <view class="instance-metrics">
      <text>显示 {{ showCount }} 次</text>
      <text>首次 {{ onceCount }} 次</text>
      <text>调用 {{ callCount }} 次</text>
    </view>
  </view>
</template>

<style scoped>
.demo-instance { padding: 14px; border: 1px solid #e2e9de; border-radius: 12px; background: #f6f8f3; }
.instance-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.instance-label { color: #4c594e; font-size: 13px; font-weight: 500; }
.instance-state { display: flex; align-items: center; gap: 5px; color: #6d8d73; font-size: 10px; }
.ready-dot { width: 5px; height: 5px; border-radius: 50%; background: #6d9975; }
.instance-metrics { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; color: #8a9386; font-size: 11px; }
</style>
