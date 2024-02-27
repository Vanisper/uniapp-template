<script lang="ts" setup>
import { useToast } from "wot-design-uni"
import { fetchHome } from "@/services/home/home"
import type KV from "@/model/KV"

const { show: showToast, loading: showLoading, close: hideLoading } = useToast()

// #region tab配置
const tabList = ref<KV<string>[]>([])
const currentTab = ref<number>(0)
const state = ref<"loading" | "error" | "finished">("loading")
// #endregion

const goods = ref<any[]>([])
const goodsListLoadStatus = ref<number>(0)

// #region 轮播图配置
const current = ref<number>(1)
const imgSrcs = ref<string[]>([])
const autoplay = ref(true)
const duration = ref<number>(500)
const interval = ref<number>(5000)
// #endregion

// TODO 初始化数据
function init() {
  showLoading({})
  fetchHome().then(({ swiper, tabList: tabs }) => {
    tabList.value = tabs
    imgSrcs.value = swiper
    hideLoading()
    loadGoodsList(true)
  })
}

// TODO 加载商品列表
function loadGoodsList(fresh = false) {
  if (fresh) {
    uni.pageScrollTo({
      scrollTop: 0,
    })
  }

  setTimeout(() => {
    goodsListLoadStatus.value = 1
    goods.value = [
      { id: 1, name: "商品1", price: 100 },
      { id: 2, name: "商品2", price: 200 },
      { id: 3, name: "商品3", price: 300 },
      { id: 4, name: "商品4", price: 400 },
      { id: 5, name: "商品5", price: 500 },
    ]
  }, 1000)
}

onMounted(() => {
  init()
})

onReachBottom(() => {
  if (goodsListLoadStatus.value === 0)
    loadGoodsList()
})

onPullDownRefresh(() => {
  init()
})

// TODO 跳转到搜索页面
function navToSearchPage() {
  showToast("跳转到搜索页面")
}

// TODO 重新加载商品数据
function onReTry() {
  loadGoodsList()
}
</script>

<template>
  <view class="home">
    <view class="home-header p3 pt-0 pb-0">
      <view class="search" @click="navToSearchPage">
        <wd-search custom-class="custom-search" hide-cancel placeholder-left disabled placeholder="mate60pro 火热发售中" />
      </view>
      <view v-if="imgSrcs.length" class="swiper">
        <wd-swiper
          height="130"
          :autoplay="autoplay"
          :duration="duration"
          :interval="interval"
          image-mode="scaleToFill"
          :current="current"
          :indicator="{ type: 'dots' }"
          :list="imgSrcs"
        />
      </view>
    </view>
    <view class="home-main p3 pt-0 pb-0">
      <view v-if="tabList.length" class="tabs">
        <wd-tabs v-model="currentTab">
          <wd-tab v-for="(tab, index) in tabList" :key="index" :title="tab.label" />
        </wd-tabs>
      </view>
      <!-- TODO 根据goods渲染商品列表 同时对 loadmore 组件的状态进行改动 -->
      <wd-loadmore :state="state" @reload="onReTry" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.home {
  width: 100vw;
  box-sizing: border-box;
  background: #fff;

  .home-header {
    .search {
      margin-bottom: 20rpx;
      :deep(.custom-search) {
        padding: 0;
      }
    }
  }
}
</style>

<!-- 设置了 `type="home"` 就表明此页面将作为home页面 -->
<route lang="json" type="home">
{
  "name": "home"
}
</route>
