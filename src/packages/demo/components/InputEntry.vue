<script setup lang="ts">
const name = shallowRef('林间访客')
const opening = shallowRef(false)
const { go } = usePages()
const canOpen = computed(() => name.value.trim().length > 0 && !opening.value)

async function openExample() {
  if (!canOpen.value)
    return

  opening.value = true
  const success = await go(`/packages/demo/pages/hi?name=${encodeURIComponent(name.value.trim())}`)
  opening.value = false
  if (!success)
    uni.showToast({ title: '页面打开失败，请重试', icon: 'none' })
}
</script>

<template>
  <view class="input-entry">
    <view class="entry-heading">
      <view class="entry-icon"><text i-carbon-direction-straight-right /></view>
      <view>
        <view class="entry-title">带着参数，去下一页</view>
        <view class="entry-subtitle">页面传参与共享计数</view>
      </view>
    </view>
    <view class="input-label">你的称呼</view>
    <input
      v-model="name"
      class="name-input"
      placeholder="输入一个称呼"
      :maxlength="30"
      confirm-type="go"
      @confirm="openExample"
    >
    <view class="input-hint">试试中文、空格或 &amp;，查看下一页收到的内容。</view>
    <button class="entry-button" :disabled="!canOpen" :loading="opening" @click="openExample">
      打开参数与计数页
      <text i-carbon-arrow-right />
    </button>
  </view>
</template>

<style scoped>
.input-entry {
  padding: 20px;
  border: 1px solid #e6eae4;
  border-radius: 18px;
  background: #fff;
}
.entry-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.entry-icon { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 12px; background: #eef5f0; color: #257864; font-size: 22px; }
.entry-title { color: #202824; font-size: 16px; font-weight: 600; }
.entry-subtitle { margin-top: 4px; color: #808781; font-size: 12px; }
.input-label { margin-bottom: 9px; color: #555e56; font-size: 13px; }
.name-input { box-sizing: border-box; width: 100%; height: 48px; padding: 0 14px; border: 1px solid #e1e6df; border-radius: 12px; background: #f8f9f6; color: #202824; font-size: 15px; }
.input-hint { margin-top: 10px; color: #808781; font-size: 12px; line-height: 1.7; }
.entry-button { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 48px; margin: 20px 0 0; padding: 0 16px; border-radius: 12px; background: #257864; color: #fff; font-size: 14px; line-height: 1.5; }
.entry-button::after { border: 0; }
.entry-button[disabled] { background: #e8ece7; color: #939c94; }
</style>
