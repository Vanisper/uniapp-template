<script lang="ts" setup generic="I extends Record<string, any>">
import type { TabbarProps, TabbarSelection, TabbarSlots } from './type'
import { computed } from 'vue'
import { resolveTabbarIndex } from './selection'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const props = withDefaults(defineProps<TabbarProps<I>>(), {
  color: '#bfbfbf',
  activeColor: '#0165ff',
  valueField: 'value',
  textField: 'text',
})

const emit = defineEmits<{
  /** 点击非活动项时立即发出，由调用方更新受控值 */
  change: [selection: TabbarSelection, item: I]
}>()

defineSlots<TabbarSlots<I>>()

const currentIndex = computed(() => resolveTabbarIndex(props))
const entries = computed(() => props.list?.map((item, index) => ({
  item,
  index,
  active: index === currentIndex.value,
  value: item[props.valueField],
  text: item[props.textField],
})) ?? [])

function handleChange(index: number) {
  const entry = entries.value[index]
  if (!entry || entry.active) {
    return
  }

  emit('change', { value: entry.value, text: entry.text }, entry.item)
}
</script>

<template>
  <view class="tabbar-placeholder" :style="{ height: `${height}px` }" />
  <view class="tabbar" :style="{ height: `${height}px` }">
    <slot name="indicator" :index="currentIndex" :count="entries.length" />
    <view
      v-for="entry in entries"
      :key="String(entry.value ?? entry.index)"
      class="tabbar__item"
      :class="{ 'tabbar__item--active': entry.active }"
      :style="{ color: entry.active ? activeColor : color }"
      @click="handleChange(entry.index)"
    >
      <view class="tabbar__content">
        <slot
          name="item"
          :item="entry.item"
          :index="entry.index"
          :active="entry.active"
          :value="entry.value"
          :text="entry.text"
        >
          <text class="tabbar__label">
            {{ entry.text }}
          </text>
        </slot>
      </view>
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

.tabbar__content {
  // 为小程序作用域插槽生成的容器提供确定宽度
  width: 100%;
  min-width: 0;
  text-align: center;
}

.tabbar__label {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
