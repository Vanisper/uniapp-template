import type { TabbarProps } from './type'

/** 在基础标签栏和动画封装之间共用选中值解析规则 */
export function resolveTabbarIndex<I extends Record<string, any>>(
  props: Pick<TabbarProps<I>, 'defaultValue' | 'list' | 'valueField'>,
) {
  const { defaultValue, list, valueField = 'value' } = props
  if (!list?.length) {
    return -1
  }

  if (typeof defaultValue === 'number') {
    return Number.isInteger(defaultValue) && defaultValue >= 0 && defaultValue < list.length ? defaultValue : 0
  }

  if (typeof defaultValue === 'string') {
    const index = list.findIndex(item => item[valueField] === defaultValue)
    return index < 0 ? 0 : index
  }

  return 0
}
