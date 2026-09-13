<script setup lang="ts">
import type { ConfigProviderThemeVars } from '@wot-ui/ui'
import WotFeedback from './WotFeedback.vue'
import WotProfileForm from './WotProfileForm.vue'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const themeVars: ConfigProviderThemeVars = {
  primary1: '#eef5f0',
  primary2: '#dcece2',
  primary6: '#257864',
  primary7: '#1d6251',
  successMain: '#257864',
  successSurface: '#eef5f0',
}
</script>

<template>
  <wd-config-provider :theme-vars="themeVars">
    <view class="wot-showcase">
      <view class="intro-row">
        <text class="page-eyebrow">COMPONENT LAB</text>
        <wd-tag type="primary" variant="light" size="small">Wot UI v2</wd-tag>
      </view>
      <view class="page-title">从输入，到交互反馈</view>
      <view class="page-description">填写一份偏好，试试校验与确认。所有操作仅在本页演示，离开后重置。</view>

      <WotProfileForm />
      <WotFeedback />

      <view class="footer-note">表单 · 按钮 · 开关 · 标签 · 轻提示 · 弹框</view>
    </view>
  </wd-config-provider>
</template>

<style scoped>
.wot-showcase { box-sizing: border-box; min-height: 100%; padding: 26px 20px 32px; background: #f5f6f3; color: #202824; }
.intro-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.page-eyebrow { color: #257864; font-size: 10px; font-weight: 600; letter-spacing: 2px; }
.page-title { margin-top: 16px; font-size: 26px; font-weight: 600; line-height: 1.4; }
.page-description { margin-top: 12px; margin-bottom: 24px; color: #808781; font-size: 13px; line-height: 1.9; }
.footer-note { margin-top: 24px; color: #939c91; font-size: 11px; text-align: center; }
</style>
