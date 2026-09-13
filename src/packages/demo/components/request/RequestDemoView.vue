<script setup lang="ts">
import type { ConfigProviderThemeVars } from '@wot-ui/ui'
import { appEnv } from '@/config/env'
import { isMockEnabled } from '@/http'
import RequestAuth from './RequestAuth.vue'
import RequestEcho from './RequestEcho.vue'
import RequestResult from './RequestResult.vue'
import { useRequestDemo } from './useRequestDemo'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const enabled = isMockEnabled || !!appEnv.apiBaseURL
const { scenario, cancelled, data, loading, errorMessage, load, cancel } = useRequestDemo(enabled)
const sourceLabel = isMockEnabled ? 'Mock 已开启' : enabled ? '真实接口' : '待配置接口'
const description = isMockEnabled
  ? '本页使用本地模拟数据，可以直接体验成功、空态、失败与取消。'
  : enabled
    ? '本页连接配置的真实接口，各场景结果由服务端返回。'
    : '请设置 VITE_API_BASE_URL 连接真实接口，或在开发环境开启 Mock 后体验。'
const themeVars: ConfigProviderThemeVars = {
  primary1: '#eef5f0',
  primary2: '#dcece2',
  primary6: '#257864',
  primary7: '#1d6251',
}
</script>

<template>
  <wd-config-provider :theme-vars="themeVars">
    <view class="request-demo">
      <view class="intro-row">
        <text class="page-eyebrow">REQUEST LAB</text>
        <wd-tag type="primary" variant="light" size="small">{{ sourceLabel }}</wd-tag>
      </view>
      <view class="page-title">让每次请求，都有状态</view>
      <view class="page-description">{{ description }}</view>

      <RequestResult
        :enabled="enabled"
        :scenario="scenario"
        :data="data"
        :loading="loading"
        :cancelled="cancelled"
        :error-message="errorMessage"
        @select="load"
        @retry="load()"
        @cancel="cancel"
      />
      <RequestEcho :enabled="enabled" />
      <RequestAuth />
      <view class="footer-note">alova · 状态与取消 · 提交回显 · Token 鉴权</view>
    </view>
  </wd-config-provider>
</template>

<style scoped>
.request-demo { box-sizing: border-box; min-height: 100%; padding: 26px 20px 32px; background: #f5f6f3; color: #202824; }
.intro-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.page-eyebrow { color: #257864; font-size: 10px; font-weight: 600; letter-spacing: 2px; }
.page-title { margin-top: 16px; font-size: 26px; font-weight: 600; line-height: 1.4; }
.page-description { margin-top: 12px; margin-bottom: 24px; color: #808781; font-size: 13px; line-height: 1.9; }
.footer-note { margin-top: 24px; color: #939c91; font-size: 11px; line-height: 1.7; text-align: center; }
</style>
