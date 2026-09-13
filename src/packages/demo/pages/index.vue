<script setup lang="ts">
import InputEntry from '../components/InputEntry.vue'

const appVersion = __APP_VERSION__
const nodeEnv = __NODE_ENV__
const { go } = usePages()

definePage({
  layout: 'default',
  style: {
    navigationBarTitleText: '测试中心',
    navigationStyle: 'default',
  },
})

async function openRefs() {
  if (!await go('/pages/tests/refs'))
    uni.showToast({ title: '页面打开失败，请重试', icon: 'none' })
}
</script>

<template>
  <view class="test-center">
    <view class="intro-row">
      <text class="page-eyebrow">PLAYGROUND</text>
      <text class="page-badge">开发工具</text>
    </view>
    <view class="page-title">把每项能力，逐一验证</view>
    <view class="page-description">在这里验证交互、页面跳转与组件能力。每次操作，都能看到真实结果。</view>

    <view class="group-heading">
      <text class="group-title">组件与生命周期</text>
      <text class="group-number">01</text>
    </view>
    <button class="refs-entry" @click="openRefs">
      <view class="entry-icon"><text i-carbon-cube /></view>
      <view class="entry-content">
        <view class="entry-title">异步组件实例</view>
        <view class="entry-description">单个实例、列表调用与页面显示</view>
        <view class="entry-tags"><text>useExposeReceiver</text><text>跨分包</text></view>
      </view>
      <text class="entry-arrow" i-carbon-chevron-right />
    </button>

    <view class="group-heading">
      <text class="group-title">路由与状态</text>
      <text class="group-number">02</text>
    </view>
    <InputEntry />

    <view class="environment-row">
      <text class="environment-dot" />
      <text>{{ nodeEnv }}</text>
      <text class="environment-divider">·</text>
      <text>v{{ appVersion }}</text>
    </view>
    <view class="footer-note">测试入口统一收录，执行结果即时呈现。</view>
  </view>
</template>

<style scoped>
.test-center { box-sizing: border-box; min-height: 100%; padding: 26px 20px 32px; background: #f5f6f3; color: #202824; }
.intro-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.page-eyebrow { color: #257864; font-size: 10px; font-weight: 600; letter-spacing: 2px; }
.page-badge { padding: 4px 8px; border: 1px solid #dce3d8; border-radius: 6px; color: #717b72; font-size: 10px; }
.page-title { margin-top: 16px; font-size: 26px; font-weight: 600; line-height: 1.4; }
.page-description { margin-top: 12px; color: #808781; font-size: 13px; line-height: 1.9; }
.group-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 28px 0 12px; }
.group-title { font-size: 14px; font-weight: 600; }
.group-number { color: #9ba397; font-family: monospace; font-size: 12px; }
.refs-entry { display: flex; align-items: center; gap: 14px; width: 100%; margin: 0; padding: 20px 16px; border: 1px solid #e6eae4; border-radius: 18px; background: #fff; text-align: left; line-height: normal; }
.refs-entry::after { border: 0; }
.entry-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 42px; height: 42px; border-radius: 12px; background: #eef5f0; color: #257864; font-size: 23px; }
.entry-content { flex: 1; min-width: 0; }
.entry-title { color: #202824; font-size: 16px; font-weight: 600; }
.entry-description { margin-top: 7px; color: #808781; font-size: 12px; line-height: 1.6; }
.entry-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; color: #879181; font-size: 10px; }
.entry-tags text { padding: 3px 5px; border-radius: 4px; background: #f5f6f2; }
.entry-arrow { flex-shrink: 0; color: #9aa394; font-size: 16px; }
.environment-row { display: flex; align-items: center; justify-content: center; gap: 7px; margin-top: 32px; color: #8b9388; font-size: 11px; }
.environment-dot { width: 5px; height: 5px; border-radius: 50%; background: #75a18a; }
.environment-divider { margin: 0 3px; }
.footer-note { margin-top: 10px; color: #a2a99d; font-size: 11px; text-align: center; }
</style>
