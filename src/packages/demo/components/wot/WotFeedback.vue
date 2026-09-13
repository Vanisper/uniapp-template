<script setup lang="ts">
import { useDialog, useToast } from '@wot-ui/ui'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const toast = useToast('wot-feedback')
const dialog = useDialog('wot-feedback')
const result = shallowRef('等待一次操作')
const confirmedCount = shallowRef(0)
const confirming = shallowRef(false)
let disposed = false

function showSuccess() {
  toast.success('操作成功，这是一条轻提示')
  result.value = '已触发成功提示'
}

async function confirmArchive() {
  if (confirming.value)
    return

  confirming.value = true
  toast.close()
  try {
    await dialog.confirm({
      title: '归档这条示例记录？',
      msg: '确认后会更新本页的归档次数，可以重复体验。',
      confirmButtonText: '确认归档',
      cancelButtonText: '暂不归档',
      // 遮罩需覆盖默认布局的导航栏（z-index: 999）
      zIndex: 2000,
    })
    if (disposed)
      return

    confirmedCount.value++
    result.value = `已确认归档，共 ${confirmedCount.value} 次`
    toast.success('示例记录已归档')
  }
  catch {
    if (!disposed)
      result.value = '已取消，本次没有归档'
  }
  finally {
    if (!disposed)
      confirming.value = false
  }
}

onScopeDispose(() => {
  disposed = true
  toast.close()
  dialog.close()
})
</script>

<template>
  <view class="feedback-card">
    <view class="section-number">02 / FEEDBACK</view>
    <view class="section-title">每次操作，都有回应</view>
    <view class="section-description">体验轻提示和二次确认，确认与取消都会留下可见结果。</view>
    <view class="feedback-actions">
      <wd-button variant="soft" :disabled="confirming" @click="showSuccess">成功提示</wd-button>
      <wd-button variant="plain" :disabled="confirming" @click="confirmArchive">模拟归档</wd-button>
    </view>
    <view class="feedback-result">
      <text class="result-dot" />
      <text>{{ result }}</text>
    </view>
    <wd-toast selector="wot-feedback" :z-index="2100" />
    <wd-dialog selector="wot-feedback" />
  </view>
</template>

<style scoped>
.feedback-card { margin-top: 16px; padding: 20px 16px; border: 1px solid #e6eae4; border-radius: 18px; background: #fff; }
.section-number { color: #8d988b; font-size: 10px; letter-spacing: 1px; }
.section-title { margin-top: 7px; font-size: 18px; font-weight: 600; }
.section-description { margin: 12px 0 18px; color: #808781; font-size: 12px; line-height: 1.8; }
.feedback-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.feedback-result { display: flex; align-items: center; gap: 7px; margin-top: 18px; color: #68826f; font-size: 12px; line-height: 1.7; }
.result-dot { flex-shrink: 0; width: 5px; height: 5px; border-radius: 50%; background: #77a58a; }
</style>
