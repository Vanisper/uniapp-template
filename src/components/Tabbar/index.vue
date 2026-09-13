<script lang="ts" setup generic="I extends Record<string, any>">
import type { TabbarProps, TabbarSelection, TabbarSlots } from './type'
import { computed } from 'vue'
import { resolveTabbarIndex } from './selection'
import { useTabbarEntries } from './useTabbarEntries'

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
  iconField: 'iconPath',
  activeIconField: 'selectedIconPath',
})

const emit = defineEmits<{
  /** 点击非活动项时立即发出，由调用方更新受控值 */
  change: [selection: TabbarSelection, item: I]
}>()

defineSlots<TabbarSlots<I>>()

const currentIndex = computed(() => resolveTabbarIndex(props))
const entries = useTabbarEntries(props, currentIndex)

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
          :icon="entry.icon"
        >
          <view class="tabbar__default">
            <image v-if="entry.icon" class="tabbar__icon" :src="entry.icon" mode="aspectFit" />
            <text class="tabbar__label">
              {{ entry.text }}
            </text>
          </view>
        </slot>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
@use './styles.scss';

.tabbar__label {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tabbar__default {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.tabbar__icon {
  display: block;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}
</style>
