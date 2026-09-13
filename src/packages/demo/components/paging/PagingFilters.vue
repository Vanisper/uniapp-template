<script setup lang="ts">
import { pagingCategories } from './data'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const keyword = defineModel<string>('keyword', { required: true })
const category = defineModel<string>('category', { required: true })
</script>

<template>
  <view class="paging-filters">
    <wd-search
      v-model="keyword"
      placeholder="试试「周末」或「城市」"
      placeholder-left
      hide-cancel
      variant="filled"
      custom-style="background: transparent; padding: 0 0 8px;"
    />
    <wd-tabs v-model="category" line-theme="text" custom-style="background: transparent;">
      <wd-tab v-for="item in pagingCategories" :key="item" :name="item" :title="item" />
    </wd-tabs>
  </view>
</template>

<style scoped>
.paging-filters { flex: none; padding: 0 var(--paging-gutter); --wot-tabs-nav-bg: transparent; --wot-search-input-bg: #e9eee7; }
</style>
