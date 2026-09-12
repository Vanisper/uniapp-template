<script lang="ts" setup>
import AppPageTabbar from '@/components/App/PageTabbar.vue'
import NavbarCapsule from '@/components/Navbar/capsule.vue'
import Navbar from '@/components/Navbar/index.vue'
import StatusBar from '@/components/StatusBar/index.vue'
import { useLayout } from '@/composables/useLayout'
import { usePageRoute } from '@/composables/usePageRoute'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const {
  goBack,
  goHome,
  isTabBarPage,
  getNavigationBarTitleText,
} = usePages()
const { hasNavbar, hasTabbar, navbarHeight, tabbarHeight, statusBarHeight } = useLayout()
const pageRoute = usePageRoute() ?? ''

const { navigationBarColor } = useTheme()

const navbarTitle = computed(() => getNavigationBarTitleText(pageRoute))
</script>

<template>
  <StatusBar v-if="hasNavbar" :height="statusBarHeight" :bg-color="navigationBarColor.backgroundColor" />
  <Navbar
    v-if="hasNavbar"
    :left-arrow="!isTabBarPage(pageRoute)"
    :title="navbarTitle"
    :height="navbarHeight"
    :top="statusBarHeight"
    :bg-color="navigationBarColor.backgroundColor"
    :text-color="navigationBarColor.frontColor"
    @click-left="goBack(true)"
  >
    <template #left>
      <NavbarCapsule
        @click-back="goBack(true)"
        @click-home="goHome()"
      />
    </template>
  </Navbar>
  <view class="flex-1 overflow-auto">
    <slot />
  </view>
  <AppPageTabbar v-if="hasTabbar" :height="tabbarHeight" />
</template>
