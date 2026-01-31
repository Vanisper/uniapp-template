<script lang="ts" setup>
import Tabbar from '@/components/tabbar/index.vue'
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
</script>

<template>
  <slot />
  <tabbar
    v-model:value="currentPage.route"
    :list="tabbarList" value-field="pagePath"
    :height="THEME_CONFIG.tabbar.height"
    @go="(i) => go(i.pagePath, true)"
  />
</template>
