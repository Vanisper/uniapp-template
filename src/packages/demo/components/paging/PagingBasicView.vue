<script setup lang="ts">
import PagingIntro from './PagingIntro.vue'
import PagingList from './PagingList.vue'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})
</script>

<template>
  <view class="paging-screen">
    <PagingIntro
      number="01"
      title="一页一页，慢慢读"
      description="下拉刷新，上滑继续加载。共 23 条内容，每页 6 条，末页显示结束状态。"
    />
    <PagingList />
  </view>
</template>

<style scoped lang="scss">
@use './styles.scss';
</style>
