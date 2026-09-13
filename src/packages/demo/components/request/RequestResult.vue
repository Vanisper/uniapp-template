<script setup lang="ts">
import type { RequestDemoData, RequestDemoScenario } from '../../api/request'
import { computed } from 'vue'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const props = defineProps<{
  enabled: boolean
  scenario: RequestDemoScenario
  data: RequestDemoData
  loading: boolean
  cancelled: boolean
  errorMessage: string
}>()

const emit = defineEmits<{
  select: [scenario: RequestDemoScenario]
  retry: []
  cancel: []
}>()

const scenarios: { value: RequestDemoScenario, label: string }[] = [
  { value: 'success', label: '正常列表' },
  { value: 'empty', label: '空列表' },
  { value: 'business-error', label: '业务错误' },
  { value: 'http-error', label: 'HTTP 错误' },
]
const status = computed(() => {
  if (!props.enabled)
    return '未配置'
  if (props.loading)
    return '请求中'
  if (props.cancelled)
    return '已取消'
  if (props.errorMessage)
    return '请求失败'
  return props.data.message ? '请求成功' : '等待请求'
})
</script>

<template>
  <view class="request-card">
    <view class="card-heading">
      <text class="section-number">01 / GET</text>
      <text class="request-status">{{ status }}</text>
    </view>
    <view class="section-title">同一请求，不同回应</view>
    <view class="section-description">选择一个场景，查看加载、数据与失败状态。</view>
    <view class="scenario-options">
      <button
        v-for="item in scenarios"
        :key="item.value"
        class="scenario-button"
        :class="{ 'scenario-button--active': scenario === item.value, 'scenario-button--disabled': loading || !enabled }"
        :disabled="loading || !enabled"
        @click="emit('select', item.value)"
      >
        {{ item.label }}
      </button>
    </view>

    <view v-if="!enabled" class="request-state">
      <text class="state-icon" i-carbon-connect />
      <view class="state-title">等待接口配置</view>
      <view class="state-description">配置地址后即可请求真实数据</view>
    </view>
    <view v-else-if="loading" class="request-state">
      <wd-loading color="#257864" />
      <view class="state-title">正在获取数据</view>
      <view class="state-description">可在返回结果前取消本次请求</view>
    </view>
    <view v-else-if="cancelled" class="request-state">
      <text class="state-icon" i-carbon-pause-outline />
      <view class="state-title">本次请求已取消</view>
      <view class="state-description">点击重新请求，继续体验当前场景</view>
    </view>
    <view v-else-if="errorMessage" class="request-state request-state--error">
      <text class="state-icon" i-carbon-warning-alt />
      <view class="state-title">{{ errorMessage }}</view>
      <view class="state-description">可重试当前场景，或切回正常列表</view>
    </view>
    <view v-else-if="!data.items.length" class="request-state">
      <text class="state-icon" i-carbon-document-blank />
      <view class="state-title">{{ data.message ? '暂时没有内容' : '等待请求结果' }}</view>
      <view class="state-description">{{ data.message ? '换个场景，继续查看列表' : '准备连接接口' }}</view>
    </view>
    <view v-else class="request-list">
      <view class="response-message">{{ data.message }}</view>
      <view v-for="item in data.items" :key="item.id" class="request-item">
        <text class="item-number">{{ String(item.id).padStart(2, '0') }}</text>
        <text class="item-title">{{ item.title }}</text>
        <text class="item-check" i-carbon-checkmark />
      </view>
    </view>

    <view class="request-actions">
      <wd-button v-if="loading" variant="plain" @click="emit('cancel')">取消请求</wd-button>
      <wd-button v-else variant="soft" :disabled="!enabled" @click="emit('retry')">
        {{ errorMessage && !cancelled ? '重试当前场景' : '重新请求' }}
      </wd-button>
    </view>
  </view>
</template>

<style scoped>
.request-card { padding: 20px 16px; border: 1px solid #e6eae4; border-radius: 18px; background: #fff; }
.card-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.section-number { color: #8d988b; font-size: 10px; letter-spacing: 1px; }
.request-status { color: #68826f; font-size: 11px; }
.section-title { margin-top: 10px; font-size: 18px; font-weight: 600; }
.section-description { margin-top: 10px; color: #808781; font-size: 12px; line-height: 1.8; }
.scenario-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 18px; }
.scenario-button { width: 100%; margin: 0; padding: 11px 8px; border: 1px solid #e6eae4; border-radius: 10px; background: #f8f9f6; color: #788278; font-size: 12px; line-height: 1.5; }
.scenario-button::after { border: 0; }
.scenario-button--active { border-color: #bdd5c7; background: #eef5f0; color: #257864; }
.scenario-button--disabled { opacity: 0.6; }
.request-state { display: flex; min-height: 154px; flex-direction: column; align-items: center; justify-content: center; padding: 16px 0; color: #68826f; text-align: center; }
.request-state--error { color: #b06a40; }
.state-icon { font-size: 28px; }
.state-title { margin-top: 12px; font-size: 14px; line-height: 1.7; }
.state-description { margin-top: 7px; color: #8b948a; font-size: 11px; line-height: 1.7; }
.request-list { min-height: 154px; padding: 16px 0; }
.response-message { margin-bottom: 12px; color: #829083; font-size: 11px; line-height: 1.7; }
.request-item { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid #f0f2ed; }
.item-number { color: #8d988b; font-size: 11px; }
.item-title { flex: 1; color: #435549; font-size: 13px; line-height: 1.6; }
.item-check { flex-shrink: 0; color: #77a58a; font-size: 16px; }
.request-actions { display: flex; justify-content: flex-start; }
</style>
