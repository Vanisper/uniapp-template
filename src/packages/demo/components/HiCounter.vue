<script setup lang="ts">
const store = useCounterStore()
const { increment, decrement } = store
const { count } = storeToRefs(store)

function reset() {
  store.$patch({ count: 0 })
}
</script>

<template>
  <view class="counter-card">
    <view class="counter-heading">
      <text class="counter-title">共享计数器</text>
      <text class="counter-badge">自动保存</text>
    </view>
    <view class="counter-description">修改后返回，再次打开，数字依然保留。</view>
    <view class="counter-controls">
      <button class="step-button" aria-label="减少计数" @click="decrement()"><text i-carbon-subtract /></button>
      <text class="counter-value">{{ count }}</text>
      <button class="step-button step-button-primary" aria-label="增加计数" @click="increment()"><text i-carbon-add /></button>
    </view>
    <button class="reset-button" :disabled="count === 0" @click="reset">重置为 0</button>
  </view>
</template>

<style scoped>
.counter-card { padding: 22px 20px 16px; border: 1px solid #e6eae4; border-radius: 18px; background: #fff; }
.counter-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.counter-title { color: #202824; font-size: 17px; font-weight: 600; }
.counter-badge { padding: 4px 8px; border-radius: 6px; background: #eef5f0; color: #257864; font-size: 10px; }
.counter-description { margin-top: 10px; color: #808781; font-size: 13px; line-height: 1.7; }
.counter-controls { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 32px 0 16px; }
.step-button { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 52px; height: 52px; min-height: 44px; margin: 0; padding: 0; border-radius: 50%; background: #f1f3ee; color: #257864; font-size: 22px; }
.step-button-primary { background: #257864; color: #fff; }
.step-button::after, .reset-button::after { border: 0; }
.counter-value { overflow: hidden; color: #202824; font-size: 48px; font-weight: 500; font-variant-numeric: tabular-nums; }
.reset-button { min-height: 44px; margin: 0; background: transparent; color: #717b72; font-size: 13px; line-height: 44px; }
.reset-button[disabled] { background: transparent; color: #a6ada5; }
</style>
