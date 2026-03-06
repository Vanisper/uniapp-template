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

const currentTab = computed({
  get: () => currentPage.value.route,
  set: val => typeof val === 'string' && go(val, true),
})
</script>

<template>
  <slot />
  <tabbar
    v-model:value="currentTab"
    :default-value="0"
    :list="tabbarList" value-field="pagePath"
    :height="THEME_CONFIG.tabbar.height"
  />
</template>
