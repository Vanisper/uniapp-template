<script lang="ts" setup>
import Navbar from '@/components/Navbar/index.vue'
import Tabbar from '@/components/Tabbar/index.vue'
import { useLayout } from '@/composables/useLayout'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const { go, goBack, pagesJson, currentPage } = usePages()
const { hasNavbar, hasTabbar, navbarHeight, tabbarHeight, hideNativeTabbar } = useLayout()

const tabbarList = pagesJson.tabBar?.list
const navbarTitle = computed(() => currentPage.value?.navigationBarTitleText || '')

onMounted(() => {
  hideNativeTabbar()
})
</script>

<template>
  <Navbar
    v-if="hasNavbar"
    :title="navbarTitle"
    :height="navbarHeight"
    @click-left="goBack(true)"
  />
  <view class="flex-1 overflow-auto">
    <slot />
  </view>
  <Tabbar
    v-if="hasTabbar"
    :default-value="currentPage.route"
    :list="tabbarList"
    value-field="pagePath"
    :height="tabbarHeight"
    @change="({ value }) => {
      typeof value === 'string' && go(value, true)
    }"
  />
</template>
