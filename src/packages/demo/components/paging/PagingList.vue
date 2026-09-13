<script setup lang="ts">
import type { PagingArticle, PagingScenario } from './data'
import { computed, ref, shallowRef } from 'vue'
import { pagingPageSize } from './data'
import PagingArticleCard from './PagingArticleCard.vue'
import PagingEmptyState from './PagingEmptyState.vue'
import { usePagingRequest } from './usePagingRequest'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const props = withDefaults(defineProps<{
  keyword?: string
  category?: string
  scenario?: PagingScenario
}>(), {
  keyword: '',
  category: '全部',
  scenario: 'normal',
})

defineEmits<{
  resetFilters: []
}>()

const paging = ref<ZPagingRef<PagingArticle>>()
const articles = ref<PagingArticle[]>([])
const loadMoreStatus = shallowRef<ZPagingEnums.LoadMoreStatus>('default')
const filtered = computed(() => Boolean(props.keyword.trim()) || props.category !== '全部')
const { query, loading, failed, requestedPage } = usePagingRequest({
  scenario: props.scenario,
  filters: () => ({ keyword: props.keyword, category: props.category }),
  complete: list => paging.value?.complete(list),
})
const statusText = computed(() => {
  if (loading.value)
    return `正在加载第 ${requestedPage.value} 页…`
  if (failed.value)
    return `第 ${requestedPage.value} 页加载失败`
  if (loadMoreStatus.value === 'no-more')
    return `共 ${articles.value.length} 条 · 已全部加载`
  return `已加载 ${articles.value.length} 条 · 每页 ${pagingPageSize} 条`
})

function reload() {
  if (!loading.value)
    void paging.value?.reload().catch(() => {})
}
</script>

<template>
  <view class="paging-list">
    <view class="list-toolbar">
      <text class="list-status" :class="{ 'list-status--failed': failed }">{{ statusText }}</text>
      <wd-button size="small" variant="text" :loading="loading" @click="reload">刷新</wd-button>
    </view>
    <view class="paging-viewport">
      <z-paging
        ref="paging"
        v-model="articles"
        :fixed="false"
        height="100%"
        :default-page-size="pagingPageSize"
        :show-scrollbar="false"
        :safe-area-inset-bottom="false"
        :refresher-enabled="true"
        loading-more-default-text="点击或上滑加载下一页"
        loading-more-loading-text="正在加载下一页…"
        loading-more-no-more-text="已经看到全部内容"
        loading-more-fail-text="本页模拟失败，点击重试"
        @query="query"
        @loading-status-change="loadMoreStatus = $event"
      >
        <view class="article-list">
          <PagingArticleCard v-for="article in articles" :key="article.id" :article="article" />
        </view>
        <template #empty="{ isLoadFailed }">
          <PagingEmptyState
            :failed="isLoadFailed"
            :filtered="filtered"
            @retry="reload"
            @reset="$emit('resetFilters')"
          />
        </template>
      </z-paging>
    </view>
  </view>
</template>

<style scoped>
.paging-list { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
.list-toolbar { display: flex; flex: none; align-items: center; justify-content: space-between; gap: 12px; min-height: var(--paging-toolbar-height); padding: 0 var(--paging-gutter) 5px; }
.list-status { color: #869087; font-size: 11px; }
.list-status--failed { color: #a07c54; }
.paging-viewport { position: relative; flex: 1; min-height: 0; overflow: hidden; }
.article-list { padding: 4px var(--paging-gutter) 0; }
</style>
