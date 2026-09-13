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

const slots = useSlots()

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
  boxSizing: 'border-box' as const,
  backgroundColor: props.bgColor,
  color: props.textColor,
  height: `${props.height}px`,
  borderBottom: props.bordered ? '1px solid var(--app-line, #e9ede8)' : 'none',
  top: `${props.top}px`,
}))

const hasLeftContent = computed(() =>
  !!slots.left || props.leftArrow || !!props.leftText,
)

const hasRightContent = computed(() =>
  !!slots.right || !!props.rightText,
)

const leftSlotStyle = {
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
}

const rightSlotStyle = {
  right: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
}
</script>

<template>
  <view
    :style="{ height: `${height}px`, flexShrink: 0 }"
  />
  <view
    pos-absolute left-0 z-999 w-full
    :style="navbarStyle"
  >
    <view relative h-full>
      <!-- 左侧插槽 -->
      <view
        v-if="hasLeftContent"
        pos-absolute flex items-center flex-shrink-0
        :style="leftSlotStyle"
        @click="!leftDisabled && emit('clickLeft')"
      >
        <slot name="left">
          <button
            class="navbar-action"
            :class="{ 'navbar-action--disabled': leftDisabled }"
            :disabled="leftDisabled"
            :hover-class="leftDisabled ? 'none' : 'navbar-action--pressed'"
            :hover-start-time="0"
            :hover-stay-time="100"
            :aria-label="leftText || '返回上一页'"
          >
            <view v-if="leftArrow" text-17px i-line-md:chevron-left />
            <view v-if="leftText" text-14px>{{ leftText }}</view>
          </button>
        </slot>
      </view>

      <!-- 中间标题 -->
      <view h-full mx-a flex items-center justify-center overflow-hidden max-w-60%>
        <text text-17px font-500 text-center truncate>
          {{ title }}
        </text>
      </view>

      <!-- 右侧插槽 -->
      <view
        v-if="hasRightContent"
        pos-absolute flex items-center flex-shrink-0
        :style="rightSlotStyle"
        @click="!rightDisabled && emit('clickRight')"
      >
        <slot name="right">
          <button
            class="navbar-action"
            :class="{ 'navbar-action--disabled': rightDisabled }"
            :disabled="rightDisabled"
            :hover-class="rightDisabled ? 'none' : 'navbar-action--pressed'"
            :hover-start-time="0"
            :hover-stay-time="100"
          >
            <view v-if="rightText" text-14px>{{ rightText }}</view>
          </button>
        </slot>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.navbar-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 44px;
  min-height: 44px;
  margin: 0;
  padding: 0 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  line-height: 1;

  &::after {
    border: 0;
  }
}

.navbar-action--pressed {
  background: rgba(128, 128, 128, 0.1);
}

.navbar-action.navbar-action--disabled {
  background: transparent;
  color: inherit;
  opacity: 0.35;
}
</style>
