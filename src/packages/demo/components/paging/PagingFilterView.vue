<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import PagingFilters from './PagingFilters.vue'
import PagingIntro from './PagingIntro.vue'
import PagingList from './PagingList.vue'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const keyword = shallowRef('')
const category = shallowRef('全部')
// 筛选变更时重建分页实例，旧请求的 complete 不能作用于新列表
const filterKey = computed(() => JSON.stringify([category.value, keyword.value.trim().toLowerCase()]))

function resetFilters() {
  keyword.value = ''
  category.value = '全部'
}
</script>

<template>
  <view class="paging-screen">
    <PagingIntro
      number="02"
      title="找到想读的那一篇"
      description="组合关键词与分类查找，切换后从第一页加载。"
    />
    <PagingFilters v-model:keyword="keyword" v-model:category="category" />
    <PagingList :key="filterKey" :keyword="keyword" :category="category" @reset-filters="resetFilters" />
  </view>
</template>

<style scoped lang="scss">
@use './styles.scss';
</style>
