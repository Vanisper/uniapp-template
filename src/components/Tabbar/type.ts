/** 标签切换事件中的字段映射结果 */
export interface TabbarSelection {
  value?: any
  text?: any
}

/** 取消待提交选择时的视觉处理 */
export interface TabbarCancelOptions {
  /** 是否恢复受控值，默认 true；false 保留当前视觉选中项 */
  restore?: boolean
}

/** 支持预选的标签栏交互控制 */
export interface TabbarExpose {
  /** 取消待提交选择，已开始的回调副作用不会被撤销 */
  cancel: (options?: TabbarCancelOptions) => void
}

/** 标签栏输入 */
export interface TabbarProps<I extends Record<string, any> = Record<string, any>> {
  /**
   * 受控选中值
   *
   * @description 字符串匹配 valueField，整数作为索引；未传或无效时选中首项
   */
  value?: string | number
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
  /**
   * 默认图标路径字段
   *
   * @default 'iconPath'
   */
  iconField?: keyof I
  /**
   * 选中图标路径字段
   *
   * @description 未配置选中图标时沿用默认图标
   * @default 'selectedIconPath'
   */
  activeIconField?: keyof I
}

/** 单个标签的插槽上下文 */
export interface TabbarItemSlotProps<I extends Record<string, any>> extends TabbarSelection {
  item: I
  index: number
  active: boolean
  /** 当前选中态对应的图标路径，static/ 路径会补为根路径 */
  icon?: string
}

/** 标签栏的装饰与内容插槽 */
export interface TabbarSlots<I extends Record<string, any>> {
  /** 底栏装饰插槽，提供选中索引与标签数量；空列表时 index 为 -1 */
  indicator?: (props: { index: number, count: number }) => any
  /** 替换标签图文，点击与选中状态仍由标签栏处理 */
  item?: (props: TabbarItemSlotProps<I>) => any
}
