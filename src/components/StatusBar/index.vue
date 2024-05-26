<script lang="ts" setup>
import { globalThemeVars } from "@/config/theme"

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: "shared",
  },
})

const windowRectStore = useWindowRectStore()
const themeStore = useThemeStore()

const bgColor = computed(() => globalThemeVars[themeStore.currentTheme].bgColor)
const statusBarHeight = computed(() => windowRectStore.windowRect.statusBarHeight)
</script>

<template>
  <view :style="{ height: `${statusBarHeight}px`, backgroundColor: bgColor }">
    <view class="status-bar" />
  </view>
</template>

<style lang="scss" scoped>
.status-bar {
    height: v-bind("`${statusBarHeight}px`");
    width: 100%;
    position: fixed;
    background-color: inherit;
    z-index: 100;
}
</style>
