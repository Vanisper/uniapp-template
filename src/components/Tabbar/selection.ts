import type { TabbarProps } from './type'

/** 在基础标签栏和动画封装之间共用选中值解析规则 */
export function resolveTabbarIndex<I extends Record<string, any>>(
  props: Pick<TabbarProps<I>, 'value' | 'list' | 'valueField'>,
) {
  const { value, list, valueField = 'value' } = props
  if (!list?.length) {
    return -1
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0 && value < list.length ? value : 0
  }

  if (typeof value === 'string') {
    const index = list.findIndex(item => item[valueField] === value)
    return index < 0 ? 0 : index
  }

  return 0
}
