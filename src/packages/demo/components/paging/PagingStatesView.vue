<script setup lang="ts">
import type { PagingScenario } from './data'
import { computed, shallowRef } from 'vue'
import PagingIntro from './PagingIntro.vue'
import PagingList from './PagingList.vue'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const scenario = shallowRef<PagingScenario>('empty')
const scenarios: { name: PagingScenario, title: string, description: string }[] = [
  { name: 'empty', title: '空结果', description: '返回空列表，展示没有内容时的提示。' },
  { name: 'first-error', title: '首屏失败', description: '第一页失败一次，点击「重新加载」即可恢复。' },
  { name: 'more-error', title: '追加失败', description: '第二页失败一次，已有内容保留；点击列表底部重试。' },
  { name: 'normal', title: '正常', description: '恢复正常分页，可下拉刷新、继续加载。' },
]
const description = computed(() => scenarios.find(item => item.name === scenario.value)?.description)
</script>

<template>
  <view class="paging-screen">
    <PagingIntro
      number="03"
      title="每一种状态，都有回应"
      description="每次切回失败场景，会重新模拟一次失败。"
    />
    <view class="scenario-controls">
      <wd-tabs v-model="scenario" line-theme="text" custom-style="background: transparent;">
        <wd-tab v-for="item in scenarios" :key="item.name" :name="item.name" :title="item.title" />
      </wd-tabs>
      <view class="scenario-description">{{ description }}</view>
    </view>
    <PagingList :key="scenario" :scenario="scenario" />
  </view>
</template>

<style scoped lang="scss">
@use './styles.scss';

.scenario-controls { flex: none; padding: 0 var(--paging-gutter); --wot-tabs-nav-bg: transparent; }
.scenario-description { min-height: var(--paging-scenario-note-height); padding: 8px 0 0; color: #829083; font-size: 11px; line-height: 1.7; }
</style>
