<script lang="ts" setup>
import { globalThemeVars } from "@/config/theme"

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: "shared",
  },
})

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  height: {
    type: Number,
    default: 48,
  },
  /**
   * 是否在windows端的小程序中隐藏，因为windows端的小程序始终会显示标题栏，所以可能有隐藏的需要
   */
  hiddenInMPPC: {
    type: Boolean,
    default: false,
  },
})

const hiddenSelf = ref(false)

const themeStore = useThemeStore()

const bgColor = computed(() => globalThemeVars[themeStore.currentTheme].bgColor)
const basePadding = ref(13)
const boxHeight = ref(props.height)
const atLastRight = ref(0)
const atLastBottom = ref(boxHeight.value)

onShow(() => {
  // 获取页面信息
  const systemInfo = uni.getSystemInfoSync()

  // #ifdef MP-WEIXIN
  // 获取胶囊按钮信息
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect()
  if (systemInfo.osName === "windows" && props.hiddenInMPPC)
    hiddenSelf.value = true

  atLastRight.value = systemInfo.screenWidth - menuButtonInfo.right + menuButtonInfo.width
  atLastBottom.value = menuButtonInfo.bottom - (systemInfo.statusBarHeight || 0)
  // #endif

  // 如果高度小于胶囊按钮高度下限，则设置为胶囊按钮高度的下限
  if (boxHeight.value < atLastBottom.value)
    boxHeight.value = atLastBottom.value
})
</script>

<template>
  <view v-if="!hiddenSelf" :style="{ height: `${boxHeight}px`, backgroundColor: bgColor }">
    <view class="title-bar">
      <view class="title-bar_prev">
        <slot name="prev" />
      </view>
      <view class="title-bar_text">
        {{ title }}
      </view>
      <view class="title-bar_next">
        <slot name="next" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.title-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: v-bind('`${boxHeight}px`');
    width: 100%;
    padding-right: v-bind('`${atLastRight + basePadding}px`');
    padding-left: v-bind('`${basePadding}px`');
    box-sizing: border-box;

    position: fixed;
    background-color: inherit;
    z-index: 100;

    .title-bar_prev {
    }

    .title-bar_text {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      font-weight: bold;
    }

    .title-bar_next {
    }

}
</style>
