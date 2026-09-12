<script lang="ts" setup generic="I extends Record<string, any>">
import type { TabbarSelection } from '../type'
import type { TabbarAnimatedExpose, TabbarAnimatedProps } from './type'
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, shallowRef, watch } from 'vue'
import Tabbar from '../index.vue'
import { resolveTabbarIndex } from '../selection'

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
})

const emit = defineEmits<{
  /** 动画与切换确认完成后发出；beforeChange 已负责导航时，此事件仅用于观察 */
  change: [selection: TabbarSelection, item: I]
}>()

const animationDuration = 260
const reducedMotion = shallowRef(false)
const duration = computed(() => reducedMotion.value ? 0 : animationDuration)
const motionStyle = computed(() => ({ transitionDuration: `${duration.value}ms` }))
const currentIndex = computed(() => resolveTabbarIndex(props))
const visualIndex = shallowRef(currentIndex.value)

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

function cancelPendingChange() {
  version += 1
  clearChangeTimer()
  pending = undefined
  visualIndex.value = currentIndex.value
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
      visualIndex.value = currentIndex.value
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

watch(() => props.defaultValue, () => {
  // 回调引起的受控值确认仍可发出成功事件；其他外部更新使请求失效
  if (confirming && pending?.index === currentIndex.value) {
    visualIndex.value = currentIndex.value
    return
  }
  cancelPendingChange()
}, { flush: 'sync' })

watch(() => props.list, cancelPendingChange, { deep: true, flush: 'sync' })
watch(() => [props.valueField, props.textField, props.beforeChange], cancelPendingChange, { flush: 'sync' })

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
  <Tabbar
    :default-value="visualIndex"
    :list="list"
    :height="height"
    :color="color"
    :active-color="activeColor"
    :value-field="valueField"
    :text-field="textField"
    @change="handleChange"
  >
    <template #indicator="{ index, count }">
      <view
        v-if="count"
        class="animated-tabbar__indicator"
        :style="{ ...motionStyle, transform: `translateX(${index * 100}%)`, width: `${100 / count}%` }"
      >
        <view class="animated-tabbar__surface" :style="{ backgroundColor: activeColor }" />
      </view>
    </template>
    <template #item="{ text, active }">
      <text
        class="animated-tabbar__label"
        :class="{ 'animated-tabbar__label--active': active }"
        :style="motionStyle"
      >
        {{ text }}
      </text>
    </template>
  </Tabbar>
</template>

<style scoped lang="scss">
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

.animated-tabbar__label--active {
  transform: translateY(-2px);
}
</style>
