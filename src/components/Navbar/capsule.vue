<script lang="ts" setup>
defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const props = withDefaults(defineProps<NavbarCapsuleProps>(), {
  showBack: true,
  showHome: true,
  backDisabled: false,
  homeDisabled: false,
  height: 32,
  width: 88,
  bgColor: 'rgba(255, 255, 255, 0.96)',
  borderColor: 'rgba(15, 23, 42, 0.12)',
  iconColor: '#111827',
  dividerColor: 'rgba(15, 23, 42, 0.12)',
  shadow: true,
})

const emit = defineEmits<{
  clickBack: []
  clickHome: []
}>()

interface NavbarCapsuleProps {
  /** 是否显示返回按钮 */
  showBack?: boolean
  /** 是否显示首页按钮 */
  showHome?: boolean
  /** 是否禁用返回按钮 */
  backDisabled?: boolean
  /** 是否禁用首页按钮 */
  homeDisabled?: boolean
  /** 胶囊高度 */
  height?: number
  /** 胶囊宽度 */
  width?: number
  /** 胶囊背景色 */
  bgColor?: string
  /** 边框颜色 */
  borderColor?: string
  /** 图标颜色 */
  iconColor?: string
  /** 分割线颜色 */
  dividerColor?: string
  /** 是否显示阴影 */
  shadow?: boolean
}

const capsuleStyle = computed(() => ({
  'height': `${props.height}px`,
  'width': `${props.width}px`,
  'backgroundColor': props.bgColor,
  'border': `1px solid ${props.borderColor}`,
  'color': props.iconColor,
  'boxShadow': props.shadow ? '0 4px 12px rgba(15, 23, 42, 0.08)' : 'none',
  '--divider-color': props.dividerColor,
}))

const isVisible = computed(() => props.showBack || props.showHome)
const showDivider = computed(() => props.showBack && props.showHome)

function handleBackClick() {
  if (props.backDisabled) {
    return
  }
  emit('clickBack')
}

function handleHomeClick() {
  if (props.homeDisabled) {
    return
  }
  emit('clickHome')
}
</script>

<template>
  <view
    v-if="isVisible"
    flex items-center rounded-full select-none
    :style="capsuleStyle" :class="{ 'has-divider': showDivider }"
    @click.stop
  >
    <view
      v-if="showBack"
      h-full flex-1 flex items-center justify-center
      :class="backDisabled ? 'op-40' : ''"
      @click.stop="handleBackClick"
    >
      <view text-18px i-carbon:chevron-left />
    </view>
    <view
      v-if="showHome"
      h-full flex-1 flex items-center justify-center
      :class="homeDisabled ? 'op-40' : ''"
      @click.stop="handleHomeClick"
    >
      <view text-16px i-carbon:home />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.has-divider {
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 1px;
    height: 100%;
    background-color: var(--divider-color);
  }
}
</style>
