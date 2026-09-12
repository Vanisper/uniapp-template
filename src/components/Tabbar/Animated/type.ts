import type { TabbarProps, TabbarSelection } from '../type'

/** 取消选择时的视觉处理 */
export interface TabbarAnimatedCancelOptions {
  /** 是否恢复受控值，默认 true；false 保留当前视觉选中项 */
  restore?: boolean
}

/** 动画标签栏的交互控制 */
export interface TabbarAnimatedExpose {
  /** 取消待提交选择，已开始的回调副作用不会被撤销 */
  cancel: (options?: TabbarAnimatedCancelOptions) => void
}

/** 带切换动画的标签栏输入 */
export interface TabbarAnimatedProps<I extends Record<string, any> = Record<string, any>> extends TabbarProps<I> {
  /**
   * 动画完成后、change 事件之前执行的切换确认
   *
   * @description
   * - 返回 false 或抛出错误时恢复受控选中值；返回 true 或不返回值时确认切换
   * - 等待确认期间忽略点击；外部值或列表变化后，过期结果不再更新界面
   * - 失效处理不会撤销回调已经发出的导航或其他副作用
   */
  beforeChange?: (selection: TabbarSelection, item: I) => boolean | void | Promise<boolean | void>
}
