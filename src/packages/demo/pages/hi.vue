<script setup lang="ts">
import HiCounter from '../components/HiCounter.vue'

definePage({
  layout: 'default',
  style: {
    navigationBarTitleText: '参数与计数',
    navigationStyle: 'default',
  },
})

const { value: name } = useQuery('name')
const { goBack } = usePages()
const displayName = computed(() => typeof name.value === 'string' && name.value ? name.value : '未传入称呼')
</script>

<template>
  <view class="query-page">
    <view class="page-eyebrow">DATA & STATE</view>
    <view class="page-title">你好，{{ displayName }}</view>
    <view class="page-description">一次跳转，验证参数和状态。</view>

    <view class="query-card">
      <view class="query-heading"><text i-carbon-checkmark-filled /><text>当前页面收到的参数</text></view>
      <view class="query-pair">
        <text class="query-key">name</text>
        <text class="query-value" selectable>{{ displayName }}</text>
      </view>
      <view class="query-note">由上一页输入，通过 useQuery 读取。</view>
    </view>
    <HiCounter />
    <button class="back-button" @click="goBack(true)">
      <text i-carbon-arrow-left />
      返回上一页
    </button>
  </view>
</template>

<style scoped>
.query-page { box-sizing: border-box; min-height: 100%; padding: 28px 20px 36px; background: #f5f6f3; color: #202824; }
.page-eyebrow { color: #257864; font-size: 10px; font-weight: 600; letter-spacing: 2px; }
.page-title { margin-top: 12px; font-size: 26px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
.page-description { margin-top: 9px; margin-bottom: 28px; color: #808781; font-size: 14px; }
.query-card { margin-bottom: 16px; padding: 20px; border: 1px solid #e6eae4; border-radius: 18px; background: #fff; }
.query-heading { display: flex; align-items: center; gap: 8px; color: #257864; font-size: 13px; font-weight: 500; }
.query-pair { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; margin-top: 22px; padding-bottom: 16px; border-bottom: 1px solid #f0f2ed; }
.query-key { color: #808781; font-family: monospace; font-size: 13px; }
.query-value { color: #202824; font-size: 16px; line-height: 1.6; text-align: right; overflow-wrap: anywhere; }
.query-note { margin-top: 14px; color: #808781; font-size: 12px; }
.back-button { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 48px; margin-top: 24px; border: 1px solid #dce2d9; border-radius: 12px; background: transparent; color: #555e56; font-size: 14px; }
.back-button::after { border: 0; }
</style>
