<script lang="ts" setup generic="I extends Record<string, any>">
import type { TabbarAnimatedProps } from '../Animated/type'
import type { TabbarExpose, TabbarSelection } from '../type'
import { computed, shallowRef } from 'vue'
import TabbarAnimated from '../Animated/index.vue'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const props = defineProps<TabbarAnimatedProps<I>>()
const emit = defineEmits<{
  /** 动画与切换确认通过后发出，由调用方更新受控值 */
  change: [selection: TabbarSelection, item: I]
}>()
const tabbar = shallowRef<TabbarExpose>()
const geometry = computed(() => {
  const scale = props.height / 72
  return {
    '--raised-height': `${props.height}px`,
    '--raised-surface-top': `${20 * scale}px`,
    '--raised-notch-width': `${84 * scale}px`,
    '--raised-circle-size': `${44 * scale}px`,
    '--raised-circle-top': `${2 * scale}px`,
    '--raised-icon-size': `${22 * scale}px`,
    '--raised-icon-top': `${29 * scale}px`,
    '--raised-icon-lift': `${-16 * scale}px`,
    '--raised-label-bottom': `${5 * scale}px`,
  }
})

defineExpose<TabbarExpose>({
  cancel: options => tabbar.value?.cancel(options),
})
</script>

<template>
  <view class="raised-tabbar" :style="geometry">
    <TabbarAnimated
      ref="tabbar"
      :value="value"
      :list="list"
      :height="height"
      :color="color"
      :active-color="activeColor"
      :value-field="valueField"
      :text-field="textField"
      :icon-field="iconField"
      :active-icon-field="activeIconField"
      :before-change="beforeChange"
      @change="(selection, item) => emit('change', selection, item)"
    >
      <template #indicator="{ index, count, motionStyle }">
        <view
          v-if="count"
          class="raised-tabbar__indicator"
          :style="{ ...motionStyle, width: `${100 / count}%`, transform: `translateX(${index * 100}%)` }"
        >
          <view class="raised-tabbar__surface" />
          <view class="raised-tabbar__circle" />
        </view>
      </template>
      <template #item="{ icon, text, active, motionStyle }">
        <view class="raised-tabbar__content" :class="{ 'raised-tabbar__content--active': active }">
          <image
            v-if="icon"
            class="raised-tabbar__icon"
            :style="motionStyle"
            :src="icon"
            mode="aspectFit"
          />
          <text class="raised-tabbar__label">
            {{ text }}
          </text>
        </view>
      </template>
    </TabbarAnimated>
  </view>
</template>

<style scoped lang="scss">
.raised-tabbar {
  position: relative;
  width: 100%;
  flex-shrink: 0;
  pointer-events: none;
  // 抬升装饰覆盖内容边缘，不在滚动区下方留下整条空白
  margin-top: calc(0px - var(--raised-surface-top));
}

.raised-tabbar :deep(.tabbar) {
  background: transparent;
  border-top: 0;
  pointer-events: none;
}

.raised-tabbar :deep(.tabbar__item) {
  align-self: flex-end;
  height: calc(var(--raised-height) - var(--raised-surface-top));
  pointer-events: auto;
}

.raised-tabbar :deep(.tabbar__item--active)::before {
  position: absolute;
  top: calc(var(--raised-circle-top) - var(--raised-surface-top));
  left: 50%;
  width: var(--raised-circle-size);
  height: var(--raised-circle-size);
  border-radius: 50%;
  transform: translateX(-50%);
  content: '';
}

.raised-tabbar :deep(.tabbar__content) {
  height: 100%;
}

.raised-tabbar__indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.raised-tabbar__surface {
  position: absolute;
  top: var(--raised-surface-top);
  bottom: 0;
  left: 50%;
  width: var(--raised-notch-width);
  transform: translateX(-50%);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 84 52'%3E%3Cpath fill='white' d='M0 0C12 0 10 32 42 32S72 0 84 0V52H0Z'/%3E%3C/svg%3E");
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.raised-tabbar__surface::before,
.raised-tabbar__surface::after {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100vw;
  background: #fff;
  content: '';
}

.raised-tabbar__surface::before {
  right: 100%;
}

.raised-tabbar__surface::after {
  left: 100%;
}

.raised-tabbar__circle {
  position: absolute;
  top: var(--raised-circle-top);
  left: 50%;
  width: var(--raised-circle-size);
  height: var(--raised-circle-size);
  transform: translateX(-50%);
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px #274f3e0d;
}

.raised-tabbar__content {
  position: relative;
  // 小程序会给作用域插槽补一层自动高度容器，不能依赖百分比继承
  height: calc(var(--raised-height) - var(--raised-surface-top));
  // 图文仅负责绘制，由底层标签统一接收点击
  pointer-events: none;
}

.raised-tabbar__icon {
  position: absolute;
  top: calc(var(--raised-icon-top) - var(--raised-surface-top));
  left: 50%;
  width: var(--raised-icon-size);
  height: var(--raised-icon-size);
  transform: translateX(-50%);
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.raised-tabbar__content--active .raised-tabbar__icon {
  transform: translate(-50%, var(--raised-icon-lift));
}

.raised-tabbar__label {
  position: absolute;
  right: 0;
  bottom: var(--raised-label-bottom);
  left: 0;
  overflow: hidden;
  font-size: 11px;
  line-height: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
