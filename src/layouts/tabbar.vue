<script lang="ts" setup>
import Tabbar from '@/components/Tabbar/index.vue'
import { THEME_CONFIG } from '@/configs/theme'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const { go, pagesJson, currentTabbarPath, syncPageStack } = usePages()
const tabbarList = pagesJson.tabBar?.list

onMounted(() => {
  syncPageStack()
  // #ifndef MP-WEIXIN
  uni.hideTabBar()
  // #endif
})
</script>

<template>
  <slot />
  <Tabbar
    :default-value="currentTabbarPath"
    :list="tabbarList" value-field="pagePath"
    :height="THEME_CONFIG.tabbar.height"
    @change="({ value }) => {
      typeof value === 'string' && go(value, true)
    }"
  />
</template>
