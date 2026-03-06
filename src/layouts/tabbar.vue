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

const { go, pagesJson, currentPage } = usePages()
const tabbarList = pagesJson.tabBar?.list

onMounted(() => {
  // #ifndef MP-WEIXIN
  uni.hideTabBar()
  // #endif
})
</script>

<template>
  <slot />
  <tabbar
    :default-value="currentPage.route"
    :list="tabbarList" value-field="pagePath"
    :height="THEME_CONFIG.tabbar.height"
    @change="({ value }) => {
      typeof value === 'string' && go(value, true)
    }"
  />
</template>
