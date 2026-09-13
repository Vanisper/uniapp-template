<script setup lang="ts">
import { computed } from 'vue'
import { useWindowInfo } from '@/composables/useWindowInfo'

defineOptions({ options: { virtualHost: true, styleIsolation: 'shared' } })
withDefaults(defineProps<{
  title?: string
  tabs?: string[]
  modelValue?: string
  profile?: boolean
}>(), { tabs: () => [] })
const emit = defineEmits<{ 'update:modelValue': [value: string], 'profile': [] }>()
const { statusBarHeight, windowInfo } = useWindowInfo()
const capsuleWidth = computed(() => {
  // #ifdef MP-WEIXIN
  const capsule = uni.getMenuButtonBoundingClientRect()
  return Math.max(96, windowInfo.value.windowWidth - capsule.left + 12)
  // #endif
  // #ifndef MP-WEIXIN
  return 46
  // #endif
})
</script>

<template>
  <view class="journal-header" :class="{ 'journal-header--profile': profile }" :style="{ paddingTop: `${statusBarHeight}px` }">
    <view class="journal-header__row">
      <template v-if="tabs.length">
        <button class="journal-header__avatar" aria-label="打开我的主页" @click="emit('profile')">
          <text class="i-carbon-sprout" />
        </button>
        <view class="journal-header__tabs">
          <button
            v-for="tab in tabs" :key="tab" class="journal-header__tab"
            :class="{ 'journal-header__tab--active': tab === modelValue }"
            @click="emit('update:modelValue', tab)"
          >
            {{ tab }}
            <view v-if="tab === modelValue" class="journal-header__underline" />
          </button>
        </view>
        <view :style="{ width: `${capsuleWidth}px`, flexShrink: 0 }" />
      </template>
      <text v-else class="journal-header__title">{{ title }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.journal-header { flex-shrink: 0; background: var(--app-surface); }
.journal-header--profile { background: transparent; }
.journal-header__row { position: relative; display: flex; align-items: center; height: 56px; max-width: 684px; margin: 0 auto; }
.journal-header__avatar { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 34px; height: 34px; padding: 0; margin-left: 22px; border: 1px solid #d9e7dd; border-radius: 50%; color: #257864; background: #e9f0e9; font-size: 22px; }
.journal-header__tabs { display: flex; flex: 1; justify-content: center; gap: 22px; padding: 0 10px; }
.journal-header__tab { position: relative; display: flex; align-items: center; min-height: 44px; padding: 0; white-space: nowrap; background: none; color: #909992; font-size: 14px; }
.journal-header__tab--active { color: var(--app-ink); font-weight: 700; }
.journal-header__tab::after { display: none; }
.journal-header__underline { position: absolute; bottom: 2px; left: calc(50% - 7px); width: 14px; height: 3px; border-radius: 2px; background: var(--app-green); }
.journal-header__title { width: 100%; text-align: center; font-size: 16px; font-weight: 600; }
@media (max-width: 360px) { .journal-header__tabs { gap: 14px; } .journal-header__avatar { margin-left: 16px; } }
</style>
