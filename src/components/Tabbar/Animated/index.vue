<script lang="ts" setup generic="I extends Record<string, any>">
import type { TabbarSelection } from '../type'
import type { TabbarAnimatedCancelOptions, TabbarAnimatedExpose, TabbarAnimatedProps, TabbarAnimatedSlots } from './type'
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, shallowRef, watch } from 'vue'
import { resolveTabbarIndex } from '../selection'
import { useTabbarEntries } from '../useTabbarEntries'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const props = withDefaults(defineProps<TabbarAnimatedProps<I>>(), {
  color: '#bfbfbf',
  activeColor: '#0165ff',
  valueField: 'value',
  textField: 'text',
  iconField: 'iconPath',
  activeIconField: 'selectedIconPath',
})

const emit = defineEmits<{
  /** 动画与切换确认通过后发出，由调用方更新受控值 */
  change: [selection: TabbarSelection, item: I]
}>()

defineSlots<TabbarAnimatedSlots<I>>()

const animationDuration = 260
const reducedMotion = shallowRef(false)
const duration = computed(() => reducedMotion.value ? 0 : animationDuration)
const animateSelection = shallowRef(false)
const motionStyle = computed(() => ({ transitionDuration: `${animateSelection.value ? duration.value : 0}ms` }))
const currentIndex = computed(() => resolveTabbarIndex(props))
const visualIndex = shallowRef(currentIndex.value)
const entries = useTabbarEntries(props, visualIndex)

interface PendingChange {
  version: number
  index: number
  selection: TabbarSelection
  item: I
}

let version = 0
let available = true
let confirming = false
let pending: PendingChange | undefined
let changeTimer: ReturnType<typeof setTimeout> | undefined

function clearChangeTimer() {
  if (changeTimer !== undefined) {
    clearTimeout(changeTimer)
    changeTimer = undefined
  }
}

function syncVisualIndex() {
  // 受控同步与恢复直接就位，只有点击预选启用过渡
  animateSelection.value = false
  visualIndex.value = currentIndex.value
}

function cancelPendingChange({ restore = true }: TabbarAnimatedCancelOptions = {}) {
  version += 1
  clearChangeTimer()
  pending = undefined
  if (restore) {
    syncVisualIndex()
  }
}

defineExpose<TabbarAnimatedExpose>({ cancel: cancelPendingChange })

function isCurrentRequest(request: PendingChange) {
  return available && request.version === version
}

async function confirmChange(request: PendingChange) {
  if (!isCurrentRequest(request)) {
    return
  }

  confirming = true
  try {
    const accepted = await props.beforeChange?.(request.selection, request.item)
    if (!isCurrentRequest(request)) {
      return
    }
    if (accepted === false) {
      cancelPendingChange()
      return
    }

    pending = undefined
    emit('change', request.selection, request.item)
    await nextTick()
    if (isCurrentRequest(request)) {
      syncVisualIndex()
    }
  }
  catch {
    if (isCurrentRequest(request)) {
      cancelPendingChange()
    }
  }
  finally {
    // 回调已开始后只能忽略结果，不能撤销它发出的副作用
    confirming = false
  }
}

function handleChange(selection: TabbarSelection, item: I) {
  if (!available || confirming) {
    return
  }

  const index = props.list?.indexOf(item) ?? -1
  if (index < 0 || index === visualIndex.value) {
    return
  }

  cancelPendingChange()
  animateSelection.value = true
  visualIndex.value = index
  if (index === currentIndex.value) {
    return
  }

  const request = { version, index, selection, item }
  pending = request
  if (duration.value === 0) {
    void confirmChange(request)
    return
  }

  changeTimer = setTimeout(() => {
    changeTimer = undefined
    void confirmChange(request)
  }, duration.value)
}

watch(() => props.value, () => {
  // 回调引起的受控值确认仍可发出成功事件；其他外部更新使请求失效
  if (confirming && pending?.index === currentIndex.value) {
    syncVisualIndex()
    return
  }
  cancelPendingChange()
}, { flush: 'sync' })

watch(() => props.list, () => cancelPendingChange(), { deep: true, flush: 'sync' })
watch(() => [props.valueField, props.textField, props.beforeChange], () => cancelPendingChange(), { flush: 'sync' })

watch(reducedMotion, (reduce) => {
  if (reduce && pending && changeTimer !== undefined) {
    clearChangeTimer()
    void confirmChange(pending)
  }
}, { flush: 'sync' })

let removeMotionListener: (() => void) | undefined

onMounted(() => {
  // #ifdef H5
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => {
      reducedMotion.value = media.matches
    }
    syncMotion()
    media.addEventListener('change', syncMotion)
    removeMotionListener = () => media.removeEventListener('change', syncMotion)
  }
  // #endif
})

onActivated(() => {
  available = true
})

onDeactivated(() => {
  available = false
  cancelPendingChange()
})

onBeforeUnmount(() => {
  available = false
  cancelPendingChange()
  removeMotionListener?.()
})
</script>

<template>
  <view class="tabbar-placeholder" :style="{ height: `${height}px` }" />
  <view class="tabbar" :style="{ height: `${height}px` }">
    <slot name="indicator" :index="visualIndex" :count="entries.length" :motion-style="motionStyle">
      <view
        v-if="entries.length"
        class="animated-tabbar__indicator"
        :style="{ ...motionStyle, transform: `translateX(${visualIndex * 100}%)`, width: `${100 / entries.length}%` }"
      >
        <view class="animated-tabbar__surface" :style="{ backgroundColor: activeColor }" />
      </view>
    </slot>
    <view
      v-for="entry in entries"
      :key="String(entry.value ?? entry.index)"
      class="tabbar__item"
      :class="{ 'tabbar__item--active': entry.active }"
      :style="{ color: entry.active ? activeColor : color }"
      @click="handleChange({ value: entry.value, text: entry.text }, entry.item)"
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
          :motion-style="motionStyle"
        >
          <view class="animated-tabbar__content">
            <image
              v-if="entry.icon"
              class="animated-tabbar__icon"
              :class="{ 'animated-tabbar__icon--active': entry.active }"
              :style="motionStyle"
              :src="entry.icon"
              mode="aspectFit"
            />
            <text
              class="animated-tabbar__label"
              :class="{ 'animated-tabbar__label--active': entry.active }"
              :style="motionStyle"
            >
              {{ entry.text }}
            </text>
          </view>
        </slot>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
@use '../styles.scss';

.animated-tabbar__indicator {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  box-sizing: border-box;
  padding: 0 6px;
  pointer-events: none;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.animated-tabbar__surface {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  opacity: 0.1;
}

.animated-tabbar__label {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition-property: transform, color;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.animated-tabbar__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.animated-tabbar__icon {
  display: block;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.animated-tabbar__icon--active,
.animated-tabbar__label--active {
  transform: translateY(-2px);
}
</style>
