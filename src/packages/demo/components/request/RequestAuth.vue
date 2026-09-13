<script setup lang="ts">
import { appEnv } from '@/config/env'
import { isMockEnabled } from '@/http'
import { useAuthDemo } from './useAuthDemo'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const {
  username,
  password,
  hasToken,
  storageMessage,
  activeAction,
  busy,
  canLogin,
  loginResult,
  profileResult,
  publicResult,
  login,
  requestProfile,
  requestPublic,
  logout,
} = useAuthDemo()
</script>

<template>
  <view class="auth-card">
    <view class="auth-heading">
      <text class="section-number">03 / AUTH</text>
      <text class="auth-token-status">{{ !isMockEnabled ? 'Mock 未开启' : hasToken ? 'Token 已缓存' : 'Token 未缓存' }}</text>
    </view>
    <view class="section-title">登录一次，看见认证流转</view>
    <view class="section-description">登录后请求个人信息，再试试匿名访问与退出。Token 只显示缓存状态。</view>
    <view class="auth-config">
      <view class="config-row"><text class="config-label">请求头</text><text class="config-value">{{ appEnv.authHeaderName }}</text></view>
      <view class="config-row"><text class="config-label">前缀</text><text class="config-value">{{ appEnv.authTokenPrefix || '无前缀，直接发送 Token' }}</text></view>
      <view class="config-row"><text class="config-label">缓存 Key</text><text class="config-value">{{ appEnv.authTokenKey }}</text></view>
    </view>
    <view v-if="!isMockEnabled" class="auth-disabled-note">请在开发环境开启 Mock 后体验，此处的示例账号仅用于模拟登录。</view>
    <template v-else>
      <view class="auth-field">
        <view class="field-label">示例账号</view>
        <input v-model="username" class="auth-input" placeholder="demo" :maxlength="40" :disabled="busy">
      </view>
      <view class="auth-field">
        <view class="field-label">示例密码</view>
        <input
          v-model="password"
          class="auth-input"
          placeholder="demo123"
          password
          :maxlength="80"
          :disabled="busy"
          confirm-type="send"
          @confirm="login"
        >
      </view>
      <view class="auth-hint">账号 demo，密码 demo123；可修改密码体验登录失败。</view>
      <view v-if="appEnv.mockLogEnabled" class="auth-hint">控制台可查看请求日志，密码、Token 与认证头已脱敏。</view>
      <view class="auth-actions">
        <wd-button :loading="activeAction === 'login'" :disabled="!canLogin" @click="login">登录并缓存</wd-button>
        <wd-button variant="plain" :disabled="!hasToken && !busy" @click="logout">清除 Token / 退出</wd-button>
      </view>
      <view class="auth-actions">
        <wd-button variant="soft" :loading="activeAction === 'profile'" :disabled="busy" @click="requestProfile">请求个人信息</wd-button>
        <wd-button variant="soft" :loading="activeAction === 'public'" :disabled="busy" @click="requestPublic">匿名请求</wd-button>
      </view>
      <view class="auth-results">
        <view class="auth-result" :class="{ 'auth-result--error': loginResult.state === 'error' }">
          <view class="result-label">登录 · meta.auth: false</view>
          <view class="result-message">{{ loginResult.message }}</view>
        </view>
        <view class="auth-result" :class="{ 'auth-result--error': profileResult.state === 'error' }">
          <view class="result-label">个人信息 · 默认携带 Token</view>
          <view class="result-message">{{ profileResult.message }}</view>
        </view>
        <view class="auth-result" :class="{ 'auth-result--error': publicResult.state === 'error' }">
          <view class="result-label">匿名接口 · meta.auth: false</view>
          <view class="result-message">{{ publicResult.message }}</view>
        </view>
      </view>
      <view v-if="storageMessage" class="auth-storage-error">{{ storageMessage }}</view>
    </template>
  </view>
</template>

<style scoped>
.auth-card { margin-top: 16px; padding: 20px 16px; border: 1px solid #e6eae4; border-radius: 18px; background: #fff; }
.auth-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.section-number { color: #8d988b; font-size: 10px; letter-spacing: 1px; }
.auth-token-status { color: #68826f; font-size: 11px; }
.section-title { margin-top: 10px; font-size: 18px; font-weight: 600; line-height: 1.6; }
.section-description { margin-top: 10px; color: #808781; font-size: 12px; line-height: 1.8; }
.auth-config { display: flex; flex-direction: column; gap: 9px; margin-top: 16px; padding: 12px; border-radius: 10px; background: #f5f8f3; }
.config-row { display: flex; gap: 12px; font-size: 11px; line-height: 1.7; }
.config-label { flex-shrink: 0; width: 58px; color: #859081; }
.config-value { min-width: 0; color: #536b5b; overflow-wrap: anywhere; }
.auth-disabled-note { margin-top: 16px; color: #808781; font-size: 12px; line-height: 1.8; }
.auth-field { margin-top: 16px; }
.field-label { margin-bottom: 8px; color: #555e56; font-size: 12px; }
.auth-input { box-sizing: border-box; width: 100%; height: 46px; padding: 0 12px; border: 1px solid #e1e6df; border-radius: 10px; background: #f8f9f6; color: #202824; font-size: 14px; }
.auth-hint { margin-top: 10px; color: #8b948a; font-size: 11px; line-height: 1.7; }
.auth-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.auth-results { display: flex; flex-direction: column; gap: 10px; margin-top: 18px; }
.auth-result { padding: 12px; border-radius: 10px; background: #f5f8f3; color: #68826f; }
.auth-result--error { background: #fff7f0; color: #b06a40; }
.result-label { opacity: 0.75; font-size: 10px; line-height: 1.6; }
.result-message { margin-top: 6px; font-size: 12px; line-height: 1.8; overflow-wrap: anywhere; }
.auth-storage-error { margin-top: 12px; color: #b06a40; font-size: 12px; line-height: 1.8; }
</style>
