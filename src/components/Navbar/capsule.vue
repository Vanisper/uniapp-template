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
  bgColor: 'rgba(255, 255, 255, 0.96)',
  borderColor: 'rgba(32, 40, 36, 0.1)',
  iconColor: '#202824',
  dividerColor: 'rgba(32, 40, 36, 0.1)',
  shadow: false,
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
  /** 胶囊宽度，默认每个可见按钮占 44px */
  width?: number
  /** 胶囊背景色 */
  bgColor?: string
  /** 边框颜色 */
  borderColor?: string
  /** 图标颜色 */
  iconColor?: string
  /** 分割线颜色 */
  dividerColor?: string
  /** 是否显示轻阴影，默认不显示 */
  shadow?: boolean
}

const isVisible = computed(() => props.showBack || props.showHome)
const showDivider = computed(() => props.showBack && props.showHome)
const capsuleWidth = computed(() => props.width ?? (showDivider.value ? 88 : 44))

const capsuleStyle = computed(() => ({
  'height': `${props.height}px`,
  'width': `${capsuleWidth.value}px`,
  'backgroundColor': props.bgColor,
  'border': `1px solid ${props.borderColor}`,
  'color': props.iconColor,
  'boxShadow': props.shadow ? '0 1px 3px rgba(32, 40, 36, 0.06)' : 'none',
  '--divider-color': props.dividerColor,
}))

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
    class="navbar-capsule"
    :style="capsuleStyle" :class="{ 'navbar-capsule--divided': showDivider }"
    @click.stop
  >
    <button
      v-if="showBack"
      class="navbar-capsule__action"
      :class="{ 'navbar-capsule__action--disabled': backDisabled }"
      :disabled="backDisabled"
      :hover-class="backDisabled ? 'none' : 'navbar-capsule__action--pressed'"
      :hover-start-time="0"
      :hover-stay-time="100"
      aria-label="返回上一页"
      @click.stop="handleBackClick"
    >
      <view text-18px i-carbon:chevron-left />
    </button>
    <button
      v-if="showHome"
      class="navbar-capsule__action"
      :class="{ 'navbar-capsule__action--disabled': homeDisabled }"
      :disabled="homeDisabled"
      :hover-class="homeDisabled ? 'none' : 'navbar-capsule__action--pressed'"
      :hover-start-time="0"
      :hover-stay-time="100"
      aria-label="返回首页"
      @click.stop="handleHomeClick"
    >
      <view text-16px i-carbon:home />
    </button>
  </view>
</template>

<style lang="scss" scoped>
.navbar-capsule {
  position: relative;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 999px;
  user-select: none;
}

.navbar-capsule--divided {
  &::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 1px;
    height: 44%;
    background-color: var(--divider-color);
    pointer-events: none;
  }
}

.navbar-capsule__action {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
  line-height: 1;

  &::after {
    border: 0;
  }
}

.navbar-capsule__action--pressed {
  background: rgba(32, 40, 36, 0.06);
}

.navbar-capsule__action.navbar-capsule__action--disabled {
  background: transparent;
  color: inherit;
  opacity: 0.35;
}
</style>
