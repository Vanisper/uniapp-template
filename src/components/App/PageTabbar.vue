<script setup lang="ts">
import type { TabbarAnimatedExpose } from '@/components/Tabbar/Animated/type'
import type { TabbarSelection } from '@/components/Tabbar/type'
import { onHide, onShow } from '@dcloudio/uni-app'
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import TabbarAnimated from '@/components/Tabbar/Animated/index.vue'
import Tabbar from '@/components/Tabbar/index.vue'
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
const animatedTabbar = shallowRef<TabbarAnimatedExpose>()
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
      animatedTabbar.value?.cancel()
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
  animatedTabbar.value?.cancel()
})
onHide(() => {
  // H5 同 tab 导航可能只触发 onHide，页面可见性仍交给页面容器
  pageVersion += 1
  // 导航交接期间旧页面仍可能可见，保留已到达的目标位置
  animatedTabbar.value?.cancel({ restore: !navigating })
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
if (THEME_CONFIG.tabbar.variant === 'animated'
  && typeof wx !== 'undefined'
  && wx.canIUse('onAppRouteDone')
  && wx.canIUse('offAppRouteDone')) {
  const restoreInactiveSelection: WechatMiniprogram.OnAppRouteDoneCallback = (event) => {
    // 转场结束后准备隐藏页的缓存；迟到事件不能打断当前页的预选
    if (event?.path && event.path === getCurrentPage()?.route && event.path !== pageRoute) {
      animatedTabbar.value?.cancel()
    }
  }
  onMounted(() => wx.onAppRouteDone(restoreInactiveSelection))
  onBeforeUnmount(() => wx.offAppRouteDone(restoreInactiveSelection))
}
// #endif
</script>

<template>
  <TabbarAnimated
    v-if="THEME_CONFIG.tabbar.variant === 'animated'"
    ref="animatedTabbar"
    :value="pageRoute"
    :list="list"
    value-field="pagePath"
    :height="height"
    :before-change="navigate"
  />
  <Tabbar
    v-else
    :value="pageRoute"
    :list="list"
    value-field="pagePath"
    :height="height"
    @change="navigate"
  />
</template>
