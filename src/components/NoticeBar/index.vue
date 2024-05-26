<script lang="ts" setup>
import NoticeIconBlack from "@/static/icons/notice_icon-black.svg"
import NoticeIconWhite from "@/static/icons/notice_icon-white.svg"

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: "shared",
  },
})

defineProps({
  customStyle: {
    type: Object as () => (Partial<CSSStyleDeclaration> | { [key: string]: string }),
  },
  customClass: {
    type: String,
  },
  theme: {
    type: String as () => "light" | "dark",
    default: "light",
  },
})

const noticeList = ref<string[]>([
  "蟹掌柜移动开单已上线！",
  "如使用中有问题，请联系客服！",
])
</script>

<template>
  <view class="notice-bar" :style="customStyle" :class="customClass">
    <view class="notice-icon-box">
      <image class="notice-icon" :src="(theme === 'light') ? NoticeIconBlack : NoticeIconWhite" mode="scaleToFill" />
    </view>
    <view class="notice-content-box">
      <view class="notice-swiper">
        <swiper
          class="notice-container"
          autoplay
          circular
          vertical
        >
          <swiper-item v-for="(item, index) in noticeList" :key="index" class="notice-item">
            {{ item }}
          </swiper-item>
        </swiper>
      </view>
      <wd-icon name="arrow-right" size="16px" color="#969696" custom-style="position: absolute;right: 0;top: 50%;transform: translateY(-50%);" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.notice-bar {
  height: 33px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-wrap: nowrap;
  margin: 0 auto;
  padding: 0 8px 0 12px;
  border-radius: 6px;
  background-color: #fff;

  .notice-icon-box {
    width: 26px;
    height: 33px;
    flex-shrink: 0;
    display: flex;
    position: relative;
    align-items: center;

    .notice-icon {
      position: absolute;
      width: 26px;
      top: 0;
      bottom: 0;
      left: 0;
      margin: auto;
      height: auto;
      display: block;
    }
  }

  .notice-content-box {
    flex: 1;
    width: 0;
    display: flex;
    flex-wrap: nowrap;
    padding: 4px 8px;
    position: relative;

    .notice-swiper, .notice-container, .notice-item {
      width: 100%;
      height: 25px !important;
      line-height: 26px;
      font-size: 12px;
    }

    .notice-item {
      color: var(--notice-bar-text-color, #666);
      opacity: var(--notice-bar-text-opacity, 1);

      line-height: 26px;
      font-size: 12px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      box-sizing: border-box;
      padding-right: 8px;
    }
  }
}
</style>
