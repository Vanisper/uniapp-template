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

const { pagesJson, currentRoute, go } = usePages()
const pageRoute = usePageRoute()
const list = pagesJson.tabBar?.list
const animatedTabbar = shallowRef<TabbarAnimatedExpose>()
let navigating = false
let pageVersion = 0

async function navigate({ value }: TabbarSelection) {
  if (navigating || typeof value !== 'string' || value === currentRoute.value) {
    return false
  }

  navigating = true
  const requestVersion = pageVersion
  try {
    const succeeded = await go(value, true)
    if (!succeeded && requestVersion === pageVersion) {
      uni.showToast({ title: '切换失败，请重试', icon: 'none' })
    }
    return succeeded
  }
  finally {
    navigating = false
  }
}

function hideNativeTabbar() {
  // #ifndef MP-WEIXIN
  uni.hideTabBar()
  // #endif
}

onMounted(hideNativeTabbar)
onShow(hideNativeTabbar)
onHide(() => {
  // H5 同 tab 导航可能只触发 onHide，页面可见性仍交给页面容器
  pageVersion += 1
  animatedTabbar.value?.cancel()
})
onBeforeUnmount(() => {
  pageVersion += 1
})
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
