<script lang="ts">
</script>

<script lang="ts" setup>
import { THEME_CONFIG } from '@/configs/theme'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const { pagesJson, go, currentPage } = usePages()
const tabbarList = pagesJson.tabBar?.list
</script>

<template>
  <slot />
  <view :style="{ height: `${THEME_CONFIG.tabbar.height}px` }" />
  <view pos-absolute bottom-0 left-0 z-1 w-full flex bg-white :style="{ height: `${THEME_CONFIG.tabbar.height}px` }">
    <view
      v-for="tabbar in tabbarList" :key="tabbar.pagePath"
      flex-grow-1 flex items-center justify-center text-10px
      :style="[currentPage.route === tabbar.pagePath && { color: THEME_CONFIG.currentThemeColor.primary }]"
      :class="{ active: currentPage.route === tabbar.pagePath }"
      @click="go(tabbar.pagePath, true)"
    >
      <text>{{ tabbar.text }}</text>
    </view>
  </view>
</template>
