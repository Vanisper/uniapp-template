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
})

const emit = defineEmits<{
  clickLeft: []
  clickRight: []
}>()

interface NavbarProps {
  /** 标题 */
  title?: string
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
}))
</script>

<template>
  <view
    :style="{ height: `${height}px`, flexShrink: 0 }"
  />
  <view
    pos-absolute top-0 left-0 z-999 w-full
    :style="navbarStyle"
  >
    <view flex items-center justify-between h-full px-3>
      <!-- 左侧插槽 -->
      <view flex items-center flex-shrink-0 @click="emit('clickLeft')">
        <slot name="left">
          <text text-20px>
            ‹
          </text>
        </slot>
      </view>

      <!-- 中间标题 -->
      <view flex-1 flex items-center justify-center px-3 overflow-hidden>
        <text text-17px font-500 text-center truncate>
          {{ title }}
        </text>
      </view>

      <!-- 右侧插槽 -->
      <view flex items-center flex-shrink-0 @click="emit('clickRight')">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>
