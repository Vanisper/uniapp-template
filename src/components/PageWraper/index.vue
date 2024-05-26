<script lang="ts" setup>
import { PageWraperProps } from "./type"
import { getPageText, isCustomNavigationStyle, isTabbar, pagesList } from "@/router/routes"
import { globalThemeVars } from "@/config/theme"

// https://blog.csdn.net/weixin_42678675/article/details/121023008
// 3.3以下版本的直接多写个script标签导出
// 3.3以上的使用defineOptions宏
defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: "shared",
  },
})

const props = defineProps(PageWraperProps)

const router = useRouter()
const route = useRoute()

const tabbarStore = useTabbarStore()
const windowRectStore = useWindowRectStore()
const themeStore = useThemeStore()
const { resetTheme, updateTheme } = themeStore

const customNavigation = computed(() => isCustomNavigationStyle(route.name || "") && (uni.getSystemInfoSync().osName !== "windows"))

function handleChange({ value }: { value: string }) {
  tabbarStore.setTabbarItemActive(value)
  router.pushTab({ name: value })
}

const themeVars = computed(() => ({
  colorTheme: globalThemeVars[themeStore.currentTheme].colorTheme, // 将设置一个全局的css变量 --wot-color-theme
  tabbarHeight: `${windowRectStore.windowRect.customtabBarHeight}px`,
  tabBgColor: globalThemeVars[themeStore.currentTheme].tabBgColor,
  textColor: globalThemeVars[themeStore.currentTheme].tabFontColor,

  // windowHeight: `calc(100vh - ${windowRectStore.windowRect.customtabBarHeight}px)`, // --wot-window-height
  safeAreaBottomInset: `${windowRectStore.windowRect.safeAreaBottomInset}px`, // --wot-safe-area-bottom-inset
  windowTop: `${(props.useNavbar && customNavigation.value) ? windowRectStore.windowRect.customTitleHeight + windowRectStore.windowRect.statusBarHeight : 0}px`, // --wot-window-top
  windowBottom: `${props.useTabbar ? (windowRectStore.windowRect.customtabBarHeight + windowRectStore.windowRect.safeAreaBottomInset) : 0}px`, // --wot-window-bottom
  windowHeight: "100vh", // --wot-window-height

  tabbarInactiveColor: globalThemeVars[themeStore.currentTheme].tabFontColor, // --wot-tabbar-inactive-color 设置为textColor
  pageBackground: globalThemeVars[themeStore.currentTheme].pageBackground, // --wot-page-background 设置为bgColor
  pageBackgroundSecondary: globalThemeVars[themeStore.currentTheme].pageBackgroundSecondary, // --wot-page-background-secondary 设置为bgColorSecondary
}))

uni.onThemeChange((res) => {
  nextTick(() => {
    updateTheme(res.theme)
  })
})

onShow(() => {
  nextTick(() => {
    resetTheme()
    tabbarStore.setTabbarItemActive(route.name)
    windowRectStore.updateWindowRect()
    uni.hideTabBar() // 隐藏原生tabbar
  })
})
onMounted(() => {
  uni.onWindowResize(windowRectStore.updateWindowRect)
})

onUnmounted(() => {
  uni.offWindowResize(windowRectStore.updateWindowRect)
})

function handleBack() {
  uni.navigateBack({})
}

function handleBackHome() {
  router.pushTab({ name: "workbench" })
}
</script>

<template>
  <wd-config-provider :theme-vars="themeVars">
    <wd-notify />
    <wd-toast />
    <wd-message-box />
    <!-- 状态栏填充 -->
    <status-bar v-if="props.useNavbar && customNavigation" />
    <!-- #ifndef H5 -->
    <!-- 标题栏 -->
    <wd-navbar v-if="props.useNavbar && customNavigation" :title="getPageText(route.name || '')" left-text="返回" left-arrow :custom-style="`--wot-navbar-height: ${windowRectStore.windowRect.customTitleHeight}px;z-index: 100;`">
      <template #capsule>
        <wd-navbar-capsule v-if="!isTabbar(route.name || '')" @back="handleBack" @back-home="handleBackHome" />
      </template>
    </wd-navbar>
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <privacy-popup :show="true" />
    <!-- #endif -->

    <view class="page-content">
      <slot />
    </view>
    <wd-tabbar
      v-if="props.useTabbar"
      :model-value="tabbarStore.getActive.name" bordered safe-area-inset-bottom placeholder fixed
      :custom-style="`background-color: ${themeVars.tabBgColor};`"
      :custom-class="themeStore.currentTheme === 'dark' ? 'tabbar-border-dark' : 'tabbar-border-light'"
      @change="handleChange"
    >
      <wd-tabbar-item
        v-for="(page, index) in pagesList.filter(v => v.tabbar)" :key="index"
        :name="page.name" :value="tabbarStore.getTabbarItemValue(page.name)" :title="page.text" :icon="page.icon"
      />
    </wd-tabbar>
  </wd-config-provider>
</template>

<style lang="scss">
.tabbar-border-dark::after {
  background-color: #ffffff1c !important;
}

.tabbar-border-light::after {
  background-color: #0000000d !important;
}

.wot-theme-light {
  position: relative;
  background-color: var(--wot-page-background);
  height: var(--wot-window-height);
  overflow: hidden;

  /* #ifdef H5 */
  height: v-bind("`${windowRectStore.windowRect.windowHeight - (props.useTabbar ? windowRectStore.windowRect.customtabBarHeight : 0)}px`");
  /* #endif */

  // 为layout布局提供高度最大化支持
  .page-content {
    height: 100%;
    /* #ifndef H5 */
    height: calc(100% - calc(var(--wot-window-top) + var(--wot-window-bottom)));
    /* #endif */
    overflow: auto;

    display: flex;
    flex-direction: column;
  }
}
</style>
