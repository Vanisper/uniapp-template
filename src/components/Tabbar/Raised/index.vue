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
    '--raised-surface-top': `${20 * scale}px`,
    '--raised-notch-width': `${72 * scale}px`,
    '--raised-notch-radius': `${32 * scale}px`,
    '--raised-notch-edge': `${33 * scale}px`,
    '--raised-circle-size': `${46 * scale}px`,
    '--raised-icon-size': `${24 * scale}px`,
    '--raised-icon-top': `${29 * scale}px`,
    '--raised-icon-lift': `${-17 * scale}px`,
    '--raised-label-bottom': `${3 * scale}px`,
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
}

.raised-tabbar :deep(.tabbar) {
  background: transparent;
  border-top: 0;
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
  background: radial-gradient(circle at 50% 0, transparent var(--raised-notch-radius), #fff var(--raised-notch-edge));
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
  top: 1px;
  left: 50%;
  width: var(--raised-circle-size);
  height: var(--raised-circle-size);
  transform: translateX(-50%);
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 10px #274f3e12;
}

.raised-tabbar__content {
  position: relative;
  height: 100%;
}

.raised-tabbar__icon {
  position: absolute;
  top: var(--raised-icon-top);
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
