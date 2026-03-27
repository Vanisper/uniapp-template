<script lang="ts" setup>
defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const props = withDefaults(defineProps<NavbarProps>(), {
  title: '',
  bgColor: '#ffffff',
  textColor: '#333333',
  bordered: true,
  top: 0,
})

const emit = defineEmits<{
  clickLeft: []
  clickRight: []
}>()

interface NavbarProps {
  /** 是否显示左侧箭头 */
  leftArrow?: boolean
  /** 左侧文案 */
  leftText?: string
  /** 是否禁用左侧 */
  leftDisabled?: boolean
  /** 右侧文案 */
  rightText?: string
  /** 是否禁用右侧 */
  rightDisabled?: boolean
  /** 标题 */
  title?: string
  /** top */
  top?: number
  /** 高度 */
  height: number
  /** 背景色 */
  bgColor?: string
  /** 文字颜色 */
  textColor?: string
  /** 是否显示下边框 */
  bordered?: boolean
}

const navbarStyle = computed(() => ({
  backgroundColor: props.bgColor,
  color: props.textColor,
  height: `${props.height}px`,
  borderBottom: props.bordered ? '1px solid #e5e5e5' : 'none',
  top: `${props.top}px`,
}))
</script>

<template>
  <view
    :style="{ height: `${height}px`, flexShrink: 0 }"
  />
  <view
    pos-absolute left-0 z-999 w-full
    :style="navbarStyle"
  >
    <view flex items-center justify-between h-full px-3>
      <!-- 左侧插槽 -->
      <view flex items-center flex-shrink-0 @click="!leftDisabled && emit('clickLeft')">
        <slot name="left">
          <view v-if="leftArrow" text-17px i-line-md:chevron-left />
          <view v-if="leftText" text-14px>{{ leftText }}</view>
        </slot>
      </view>

      <!-- 中间标题 -->
      <view flex-1 flex items-center justify-center px-3 overflow-hidden>
        <text text-17px font-500 text-center truncate>
          {{ title }}
        </text>
      </view>

      <!-- 右侧插槽 -->
      <view flex items-center flex-shrink-0 @click="!rightDisabled && emit('clickRight')">
        <slot name="right">
          <view v-if="rightText" text-14px>{{ rightText }}</view>
        </slot>
      </view>
    </view>
  </view>
</template>
