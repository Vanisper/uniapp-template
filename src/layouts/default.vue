<script lang="ts" setup>
import Navbar from '@/components/Navbar/index.vue'
import StatusBar from '@/components/StatusBar/index.vue'
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
const { hasNavbar, hasTabbar, navbarHeight, tabbarHeight, statusBarHeight, hideNativeTabbar } = useLayout()

const { navigationBarColor } = useManualTheme()

const tabbarList = pagesJson.tabBar?.list
const navbarTitle = computed(() => currentPage.value?.navigationBarTitleText || '')

onMounted(() => {
  hideNativeTabbar()
})
</script>

<template>
  <StatusBar v-if="hasNavbar" :height="statusBarHeight" :bg-color="navigationBarColor.backgroundColor" />
  <Navbar
    v-if="hasNavbar"
    :left-arrow="!currentPage.tabbarPage"
    :title="navbarTitle"
    :height="navbarHeight"
    :top="statusBarHeight"
    :bg-color="navigationBarColor.backgroundColor"
    :text-color="navigationBarColor.frontColor"
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
