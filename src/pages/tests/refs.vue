<script setup lang="ts">
import Demo from '@/packages/demo/components/Demo.vue'

defineOptions({
  componentPlaceholder: {
    Demo: 'view',
  },
})

definePage({
  layout: 'default',
  style: {
    navigationBarTitleText: '异步组件实例',
    navigationStyle: 'custom',
  },
})

type DemoCompExposed = ComponentExposed<typeof Demo>

const receiver = useExposeReceiver<DemoCompExposed>()
const items = [{ id: 'a', label: '列表实例 A' }, { id: 'b', label: '列表实例 B' }]
const receivers = new Map(items.map(item => [item.id, useExposeReceiver<DemoCompExposed>()]))
const pending = shallowRef<Record<string, boolean>>({})
const latestResult = shallowRef<{ label: string, message: string, success: boolean, time: string }>()
const { go } = usePages()
let disposed = false

function receiverOf(id: string) {
  const receiver = receivers.get(id)
  if (!receiver)
    throw new Error(`未找到 id 为 ${id} 的 expose 容器`)
  return receiver
}

async function callItem(id: string, label: string, getRef: RefReadyGetter<DemoCompExposed>, message: string) {
  if (pending.value[id])
    return

  pending.value = { ...pending.value, [id]: true }
  try {
    const instance = await getRef()
    const result = instance.test(message)
    if (!disposed)
      latestResult.value = { label, message: result, success: true, time: resultTime() }
  }
  catch (error) {
    if (!disposed) {
      latestResult.value = {
        label,
        message: error instanceof Error ? error.message : '调用失败，请返回后重试',
        success: false,
        time: resultTime(),
      }
    }
  }
  finally {
    if (!disposed)
      pending.value = { ...pending.value, [id]: false }
  }
}

function resultTime() {
  const now = new Date()
  return [now.getHours(), now.getMinutes(), now.getSeconds()].map(value => String(value).padStart(2, '0')).join(':')
}

async function testPageShow() {
  if (!await go(`/packages/demo/pages/hi?name=${encodeURIComponent('生命周期测试')}`))
    uni.showToast({ title: '页面打开失败，请重试', icon: 'none' })
}

onShow(() => {
  void callItem('single', '单个组件 · 自动调用', receiver.getRef, '页面显示后，成功取得组件实例')
})

onUnmounted(() => {
  disposed = true
})
</script>

<template>
  <view class="refs-page">
    <view class="page-eyebrow">COMPONENT LAB</view>
    <view class="page-title">从加载，到响应</view>
    <view class="page-description">等待组件就绪后调用方法，结果直接显示在这里。</view>

    <view class="result-card" :class="{ 'result-error': latestResult && !latestResult.success }">
      <view class="result-heading">
        <text class="result-label">最近执行结果</text>
        <text class="result-time">{{ latestResult?.time ?? '等待组件就绪' }}</text>
      </view>
      <view class="result-message">{{ latestResult?.message ?? '页面显示后会自动执行一次调用…' }}</view>
      <view class="result-source">{{ latestResult?.label ?? '单个组件 · 自动调用' }}</view>
    </view>

    <view class="example-card">
      <view class="example-heading"><text class="example-index">01</text><text>单个组件</text></view>
      <view class="example-description">页面首次显示时自动调用，也可以手动再次执行。</view>
      <Demo :expose="receiver" label="单个实例" />
      <button class="run-button" :loading="pending.single" :disabled="pending.single" @click="callItem('single', '单个组件 · 手动调用', receiver.getRef, '你好，来自单个组件的回应')">
        调用组件方法<text i-carbon-arrow-up-right />
      </button>
    </view>

    <view class="example-card">
      <view class="example-heading"><text class="example-index">02</text><text>列表中的独立实例</text></view>
      <view class="example-description">按业务 ID 保存接收容器，每个按钮只调用对应的实例。</view>
      <view v-for="item in items" :key="item.id" class="list-example">
        <Demo :expose="receiverOf(item.id)" :label="item.label" />
        <button class="run-button run-button-secondary" :loading="pending[item.id]" :disabled="pending[item.id]" @click="callItem(item.id, item.label, receiverOf(item.id).getRef, `你好，来自${item.label} 的回应`)">
          调用实例 {{ item.id.toUpperCase() }}<text i-carbon-arrow-up-right />
        </button>
      </view>
    </view>

    <view class="lifecycle-section">
      <view class="lifecycle-title">再看一次页面显示</view>
      <view class="lifecycle-description">打开子页面再返回，观察「显示」次数增加，而「首次」始终为 1。</view>
      <button class="lifecycle-button" @click="testPageShow">打开子页面<text i-carbon-arrow-right /></button>
    </view>
    <view class="footer-note">主包页面 → 分包组件 · useExposeReceiver</view>
  </view>
</template>

<style scoped>
.refs-page { box-sizing: border-box; min-height: 100%; padding: 26px 20px 32px; background: #f5f6f3; color: #202824; }
.page-eyebrow { color: #257864; font-size: 10px; font-weight: 600; letter-spacing: 2px; }
.page-title { margin-top: 12px; font-size: 27px; font-weight: 600; }
.page-description { margin-top: 10px; color: #808781; font-size: 13px; line-height: 1.8; }
.result-card { margin-top: 24px; padding: 18px; border: 1px solid #d6e5d8; border-radius: 16px; background: #eaf2eb; }
.result-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.result-label { color: #257864; font-size: 12px; font-weight: 600; }
.result-time { color: #7c9480; font-family: monospace; font-size: 11px; }
.result-message { margin-top: 13px; color: #345640; font-size: 15px; line-height: 1.65; overflow-wrap: anywhere; }
.result-source { margin-top: 10px; color: #7c9480; font-size: 11px; }
.result-error { border-color: #ecd9d1; background: #faf0ec; }
.result-error .result-message { color: #985645; }
.example-card { margin-top: 18px; padding: 20px; border: 1px solid #e6eae4; border-radius: 18px; background: #fff; }
.example-heading { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; }
.example-index { color: #8ca38c; font-family: monospace; font-size: 12px; font-weight: 400; }
.example-description { margin: 12px 0 18px; color: #808781; font-size: 12px; line-height: 1.8; }
.run-button { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 46px; margin: 12px 0 0; padding: 0 14px; border-radius: 10px; background: #257864; color: #fff; font-size: 13px; line-height: 1.5; }
.run-button::after, .lifecycle-button::after { border: 0; }
.run-button-secondary { border: 1px solid #dbe5d8; background: #fff; color: #257864; }
.run-button[disabled] { background: #e8ece7; color: #939c94; }
.list-example + .list-example { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eef1ea; }
.lifecycle-section { padding: 25px 0 8px; }
.lifecycle-title { color: #555f53; font-size: 14px; font-weight: 600; }
.lifecycle-description { margin-top: 9px; color: #879081; font-size: 12px; line-height: 1.8; }
.lifecycle-button { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 46px; margin: 14px 0 0; padding: 0 14px; border: 1px solid #dce2d9; border-radius: 10px; background: transparent; color: #555f53; font-size: 13px; }
.footer-note { margin-top: 20px; color: #a2a99d; font-size: 10px; text-align: center; }
</style>
