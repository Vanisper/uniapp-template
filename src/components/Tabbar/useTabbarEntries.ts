import type { Ref } from 'vue'
import type { TabbarProps } from './type'
import { computed } from 'vue'

type EntryProps<I extends Record<string, any>> = Pick<TabbarProps<I>, 'list'> & Required<Pick<
  TabbarProps<I>,
  'valueField' | 'textField' | 'iconField' | 'activeIconField'
>>

/** 根据字段映射与当前视觉索引生成标签图文 */
export function useTabbarEntries<I extends Record<string, any>>(props: EntryProps<I>, currentIndex: Readonly<Ref<number>>) {
  return computed(() => props.list?.map((item, index) => {
    const active = index === currentIndex.value
    const source = (active && item[props.activeIconField]) || item[props.iconField]
    const icon = typeof source === 'string' && source
      ? source.startsWith('static/') ? `/${source}` : source
      : undefined

    return {
      item,
      index,
      active,
      icon,
      value: item[props.valueField],
      text: item[props.textField],
    }
  }) ?? [])
}
