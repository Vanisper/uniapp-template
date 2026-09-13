<script setup lang="ts">
import { useRequest } from 'alova/client'
import { computed, onScopeDispose, shallowRef } from 'vue'
import { postRequestDemo } from '../../api/request'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const props = defineProps<{ enabled: boolean }>()
const message = shallowRef('你好，alova')
const { data, loading, error, send, abort } = useRequest(postRequestDemo, {
  immediate: false,
})
const canSubmit = computed(() => props.enabled && !!message.value.trim() && !loading.value)
let pending = false

async function submit() {
  if (!canSubmit.value || pending)
    return

  pending = true
  error.value = undefined
  try {
    await send(message.value.trim())
  }
  catch {
    // 失败状态由 useRequest 的 error 统一呈现
  }
  finally {
    pending = false
  }
}

onScopeDispose(() => {
  if (pending)
    void abort()
})
</script>

<template>
  <view class="echo-card">
    <view class="section-number">02 / POST</view>
    <view class="section-title">发出一句话，收回一个回应</view>
    <view class="section-description">输入内容并提交，查看接口返回的文本。</view>
    <input
      v-model="message"
      class="echo-input"
      placeholder="输入要发送的内容"
      :maxlength="80"
      :disabled="loading || !enabled"
      confirm-type="send"
      @confirm="submit"
    >
    <view class="echo-actions">
      <wd-button :loading="loading" :disabled="!canSubmit" @click="submit">发送内容</wd-button>
    </view>
    <view v-if="loading" class="echo-result">正在提交…</view>
    <view v-else-if="error" class="echo-result echo-result--error">{{ error.message }}</view>
    <view v-else-if="data" class="echo-result">收到：{{ data.message }}</view>
    <view v-else class="echo-result">{{ enabled ? '等待一次提交' : '配置接口后可提交' }}</view>
  </view>
</template>

<style scoped>
.echo-card { margin-top: 16px; padding: 20px 16px; border: 1px solid #e6eae4; border-radius: 18px; background: #fff; }
.section-number { color: #8d988b; font-size: 10px; letter-spacing: 1px; }
.section-title { margin-top: 10px; font-size: 18px; font-weight: 600; line-height: 1.6; }
.section-description { margin-top: 10px; color: #808781; font-size: 12px; line-height: 1.8; }
.echo-input { box-sizing: border-box; width: 100%; height: 46px; margin-top: 18px; padding: 0 12px; border: 1px solid #e1e6df; border-radius: 10px; background: #f8f9f6; color: #202824; font-size: 14px; }
.echo-actions { display: flex; margin-top: 14px; }
.echo-result { margin-top: 16px; color: #68826f; font-size: 12px; line-height: 1.8; overflow-wrap: anywhere; }
.echo-result--error { color: #b06a40; }
</style>
