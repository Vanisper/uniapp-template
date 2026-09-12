/** 标签切换事件中的字段映射结果 */
export interface TabbarSelection {
  value?: any
  text?: any
}

/** 标签栏输入 */
export interface TabbarProps<I extends Record<string, any> = Record<string, any>> {
  /**
   * 当前选中值，沿用历史属性名，实际为受控属性
   *
   * @description 字符串匹配 valueField，整数作为索引；未传或无效时选中首项
   */
  defaultValue?: string | number
  /** 标签栏高度，单位 px */
  height: number
  /** 未选中文字颜色 */
  color?: string
  /** 选中文字颜色 */
  activeColor?: string
  /** 标签列表，valueField 对应的值应唯一 */
  list?: I[]
  /**
   * 标签值字段
   *
   * @default 'value'
   */
  valueField?: keyof I
  /**
   * 标签文字字段
   *
   * @default 'text'
   */
  textField?: keyof I
}

/** 单个标签的插槽上下文 */
export interface TabbarItemSlotProps<I extends Record<string, any>> extends TabbarSelection {
  item: I
  index: number
  active: boolean
}

/** 标签栏的装饰与内容插槽 */
export interface TabbarSlots<I extends Record<string, any>> {
  /** 指示器所在容器与标签等宽排列，空列表时 index 为 -1 */
  indicator?: (props: { index: number, count: number }) => any
  /** 替换标签文字，点击与选中状态仍由标签栏处理 */
  item?: (props: TabbarItemSlotProps<I>) => any
}
