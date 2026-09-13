<script setup lang="ts">
import type { TabbarExpose, TabbarSelection } from '@/components/Tabbar/type'
import { onHide, onShow } from '@dcloudio/uni-app'
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import Tabbar from '@/components/Tabbar/Raised/index.vue'
import { usePageRoute } from '@/composables/usePageRoute'
import { usePages } from '@/composables/usePages'
import { THEME_CONFIG } from '@/configs/theme'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

withDefaults(defineProps<{
  height?: number
}>(), {
  height: THEME_CONFIG.tabbar.height,
})

const { pagesJson, getCurrentPage, go } = usePages()
const pageRoute = usePageRoute()
const list = pagesJson.tabBar?.list
const colors = { normal: '#89948f', active: '#257864' }
const tabbar = shallowRef<TabbarExpose>()
let navigating = false
let pageVersion = 0

async function navigate({ value }: TabbarSelection) {
  if (navigating || typeof value !== 'string' || value === getCurrentPage()?.route) {
    return false
  }

  navigating = true
  const requestVersion = pageVersion
  try {
    const succeeded = await go(value, true)
    if (!succeeded) {
      tabbar.value?.cancel()
      if (requestVersion === pageVersion) {
        uni.showToast({ title: '切换失败，请重试', icon: 'none' })
      }
    }
    return succeeded
  }
  finally {
    navigating = false
  }
}

onShow(() => {
  tabbar.value?.cancel()
})
onHide(() => {
  // H5 同 tab 导航可能只触发 onHide，页面可见性仍交给页面容器
  pageVersion += 1
  // 导航交接期间旧页面仍可能可见，保留已到达的目标位置
  tabbar.value?.cancel({ restore: !navigating })
})
onBeforeUnmount(() => {
  pageVersion += 1
})

// #ifndef MP-WEIXIN
function hideNativeTabbar() {
  uni.hideTabBar()
}

onMounted(hideNativeTabbar)
onShow(hideNativeTabbar)
// #endif

// #ifdef MP-WEIXIN
if (typeof wx !== 'undefined'
  && wx.canIUse('onAppRouteDone')
  && wx.canIUse('offAppRouteDone')) {
  const restoreInactiveSelection: WechatMiniprogram.OnAppRouteDoneCallback = (event) => {
    // 转场结束后准备隐藏页的缓存；迟到事件不能打断当前页的预选
    if (event?.path && event.path === getCurrentPage()?.route && event.path !== pageRoute) {
      tabbar.value?.cancel()
    }
  }
  onMounted(() => wx.onAppRouteDone(restoreInactiveSelection))
  onBeforeUnmount(() => wx.offAppRouteDone(restoreInactiveSelection))
}
// #endif
</script>

<template>
  <Tabbar
    ref="tabbar"
    :value="pageRoute"
    :list="list"
    value-field="pagePath"
    :height="height"
    :before-change="navigate"
    :color="colors.normal"
    :active-color="colors.active"
  />
  <view class="page-tabbar-safe-area" />
</template>

<style scoped>
.page-tabbar-safe-area {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  height: var(--page-bottom, 0px);
  background: #fff;
  pointer-events: none;
}
</style>
