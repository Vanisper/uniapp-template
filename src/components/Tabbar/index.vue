<script lang="ts" setup generic="I extends Record<string, any>, T extends Array<I>">
import { computed } from 'vue'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const props = withDefaults(defineProps<{
  defaultValue?: string | number
  // #region style
  height: number
  color?: string
  activeColor?: string
  // #endregion
  // #region tabbar options
  list?: T
  /**
   * @default 'value'
   */
  valueField?: keyof I
  /**
   * @default 'text'
   */
  textField?: keyof I
  // #endregion
}>(), {
  color: '#bfbfbf',
  activeColor: '#0165ff',
  valueField: 'value',
  textField: 'text',
})

const emit = defineEmits<{
  change: [{ value?: any, text?: any }, I]
}>()

const currentIndex = computed(() => {
  const list = props.list
  if (!list?.length) {
    return -1
  }

  const value = props.defaultValue
  if (typeof value === 'number') {
    return value >= 0 && value < list.length ? value : 0
  }

  if (typeof value === 'string') {
    const index = list.findIndex(item => item[props.valueField] === value)
    return index >= 0 ? index : 0
  }

  return 0
})

const current = computed(() => {
  const index = currentIndex.value
  return index >= 0 ? props.list?.[index] : undefined
})

const indicatorStyle = computed(() => {
  const count = props.list?.length ?? 0
  if (!count || currentIndex.value < 0) {
    return {}
  }

  return {
    opacity: '1',
    transform: `translateX(${currentIndex.value * 100}%)`,
    width: `${100 / count}%`,
  }
})

function isActive(params: I) {
  const valueField = props.valueField
  return current.value?.[valueField] === params[valueField]
}

function handler(params: I) {
  if (isActive(params)) {
    return
  }

  emit('change', { value: params[props.valueField], text: params[props.textField] }, params)
}
</script>

<template>
  <view class="tabbar-placeholder" :style="{ height: `${height}px` }" />
  <view class="tabbar" :style="{ height: `${height}px` }">
    <view
      v-if="list?.length"
      class="tabbar__indicator"
      :style="indicatorStyle"
    >
      <view class="tabbar__indicator-surface" />
    </view>

    <view
      v-for="(item, index) in list"
      :key="String(item[valueField] ?? index)"
      class="tabbar__item"
      :class="{ 'tabbar__item--active': isActive(item) }"
      :style="{ color: isActive(item) ? activeColor : color }"
      @click="handler(item)"
    >
      <text class="tabbar__label">
        {{ item[textField] }}
      </text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.tabbar-placeholder {
  flex-shrink: 0;
}

.tabbar {
  position: absolute;
  z-index: 1;
  bottom: 0;
  left: 0;
  display: flex;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.tabbar__indicator {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  box-sizing: border-box;
  padding: 0 6px;
  pointer-events: none;
  opacity: 0;
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease-out;
}

.tabbar__indicator-surface {
  width: 100%;
  height: 100%;
  background: rgba(1, 101, 255, 0.1);
  border-radius: 8px;
}

.tabbar__item {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  min-width: 0;
  font-size: 12px;
}

.tabbar__label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms ease-out;
}

.tabbar__item--active .tabbar__label {
  transform: translateY(-2px);
}

/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  .tabbar__indicator,
  .tabbar__label {
    transition-duration: 0.01ms;
  }
}
/* #endif */
</style>
