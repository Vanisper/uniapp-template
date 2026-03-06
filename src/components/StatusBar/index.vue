<script lang="ts" setup>
interface StatusBarProps {
  /** 高度 */
  height: number
  /** 背景色 */
  bgColor?: string
}

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const props = withDefaults(defineProps<StatusBarProps>(), {
  bgColor: 'transparent',
})

const statusBarStyle = computed(() => ({
  backgroundColor: props.bgColor,
  height: `${props.height}px`,
}))
</script>

<template>
  <view
    v-if="height > 0"
    class="status-bar"
    :style="statusBarStyle"
  />
</template>

<style lang="scss" scoped>
.status-bar {
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}
</style>
