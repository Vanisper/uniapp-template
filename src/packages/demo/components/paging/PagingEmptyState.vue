<script setup lang="ts">
defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

defineProps<{
  failed: boolean
  filtered: boolean
}>()

defineEmits<{
  retry: []
  reset: []
}>()
</script>

<template>
  <view class="empty-state">
    <view class="empty-symbol" :class="{ 'empty-symbol--failed': failed }">
      <text v-if="failed" i-carbon-cloud-offline />
      <text v-else i-carbon-search />
    </view>
    <view class="empty-title">{{ failed ? '这次没有加载成功' : '这里暂时没有内容' }}</view>
    <view class="empty-description">
      {{ failed ? '这是一次模拟失败，重新加载即可恢复。' : filtered ? '换个关键词，或者查看全部分类。' : '当前模拟返回空列表，可切换上方场景。' }}
    </view>
    <wd-button v-if="failed" size="small" @click="$emit('retry')">重新加载</wd-button>
    <wd-button v-else-if="filtered" size="small" variant="subtle" @click="$emit('reset')">清除筛选</wd-button>
  </view>
</template>

<style scoped>
.empty-state { display: flex; flex-direction: column; align-items: center; padding: 28px 20px; text-align: center; }
.empty-symbol { display: flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 22px; background: #eaf0e8; color: #648871; font-size: 29px; }
.empty-symbol--failed { background: #f3ece3; color: #a08460; }
.empty-title { margin-top: 18px; color: #344037; font-size: 17px; font-weight: 500; }
.empty-description { max-width: 250px; margin: 10px 0 20px; color: #8a948c; font-size: 12px; line-height: 1.7; }

@media (max-height: 600px) {
  .empty-state { padding: 16px; }
  .empty-symbol { width: 48px; height: 48px; border-radius: 16px; font-size: 24px; }
  .empty-title { margin-top: 12px; font-size: 15px; }
  .empty-description { margin: 8px 0 12px; }
}

@media (max-height: 420px) {
  .empty-state { padding: 10px 16px; }
  .empty-symbol { display: none; }
  .empty-title { margin-top: 0; }
  .empty-description { margin: 6px 0 10px; font-size: 11px; }
}
</style>
