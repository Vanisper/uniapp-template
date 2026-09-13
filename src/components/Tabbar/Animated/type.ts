import type { CSSProperties } from 'vue'
import type { TabbarCancelOptions, TabbarExpose, TabbarItemSlotProps, TabbarProps, TabbarSelection } from '../type'

/** 动画标签栏的装饰与内容插槽 */
export interface TabbarAnimatedSlots<I extends Record<string, any>> {
  /** 预选位置与当前过渡样式；同步或取消时过渡时长为零 */
  indicator?: (props: { index: number, count: number, motionStyle: CSSProperties }) => any
  /** 替换标签图文，并沿用当前选择的过渡时长 */
  item?: (props: TabbarItemSlotProps<I> & { motionStyle: CSSProperties }) => any
}

/** 取消选择时的视觉处理 */
export type TabbarAnimatedCancelOptions = TabbarCancelOptions

/** 动画标签栏的交互控制 */
export type TabbarAnimatedExpose = TabbarExpose

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
