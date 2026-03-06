<script lang="ts" setup generic="I extends Record<string, any>, T extends Array<I>">
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

const value = defineModel<string | number>('value')

const current = computed(() => {
  const _value = value.value ?? props.defaultValue ?? 0
  const _list = props.list
  if (typeof _value === 'string') {
    return _list?.find(i => i[props.valueField] === value.value)
  }
  return _list?.[_value] ?? _list?.[0]
})

function isActive(params: I) {
  const valueField = props.valueField
  return current.value?.[valueField] === params[valueField]
}

function handler(params: I) {
  value.value = params[props.valueField]
  emit('change', { value: params[props.valueField], text: params[props.textField] }, params)
}
</script>

<template>
  <view :style="{ height: `${height}px` }" />
  <view pos-absolute bottom-0 left-0 z-1 w-full flex bg-white :style="{ height: `${height}px` }">
    <view
      v-for="(item, index) in list" :key="index"
      flex-grow-1 flex items-center justify-center text-10px
      :style="{ color: isActive(item) ? activeColor : color }"
      @click="handler(item)"
    >
      <text>{{ item[textField] }}</text>
    </view>
  </view>
</template>
