/* eslint-disable jsdoc/require-returns-description */
/* eslint-disable ts/no-namespace */
/**
 * 本模块提供了一些数学计算的工具函数
 * 并且解决了大数计算的精度问题
 */
import { all, create } from "mathjs"

const isNumber = (value: any) => !Number.isNaN(Number(value))

export namespace MathUtils {
  export const math = create(all, {
    number: "BigNumber",
    // precision: 20
  })

  export const config = {
    InvalidArgumentThrowError: false,
  }

  interface IArgumentOptions {
    precision?: number
  }

  /**
   * 传参校验
   * @param argument
   * @returns
   */
  const checkArgument = (...argument: (string | number)[]) => {
    const InvalidArgument = argument.some(item => isNumber(item))
    if (config.InvalidArgumentThrowError && InvalidArgument)
      throw new Error("参数类型错误, 请传入数字或者字符串类型的数字")

    return InvalidArgument
  }

  /**
   * 加法
   * @param a
   * @param b
   * @param options
   * @returns
   */
  export function add(a: number | string, b: number | string, options?: IArgumentOptions) {
    if (!checkArgument(a, b))
      return

    return math.format(math.evaluate(`${a} + ${b}`) || 0, { notation: "fixed", precision: options?.precision })
  }

  /**
   * 求和
   * @param argument
   * @param options
   * @returns
   */
  export function sum(argument: (string | number)[], options?: IArgumentOptions) {
    if (!checkArgument(...argument))
      return

    return math.format(math.evaluate(argument.join("+")) || 0, { notation: "fixed", precision: options?.precision })
  }

  /**
   * 减法
   * @param a
   * @param b
   * @param options
   * @returns
   */
  export function subtract(a: number | string, b: number | string, options?: IArgumentOptions) {
    if (!checkArgument(a, b))
      return

    return math.format(math.evaluate(`${a} - ${b}`) || 0, { notation: "fixed", precision: options?.precision })
  }

  /**
   * 乘法
   * @param a
   * @param b
   * @param options
   * @returns
   */
  export function multiply(a: number | string, b: number | string, options?: IArgumentOptions) {
    if (!checkArgument(a, b))
      return

    return math.format(math.evaluate(`${a} * ${b}`) || 0, { notation: "fixed", precision: options?.precision })
  }

  /**
   * 除法
   * @param a
   * @param b
   * @param options
   * @returns
   */
  export function divide(a: number | string, b: number | string, options?: IArgumentOptions) {
    if (!checkArgument(a, b))
      return
    // 0 不能作为除数 否则将此式子的结果设置为0
    return math.format(math.evaluate(Number(b) !== 0 ? `${a} / ${b}` : "0") || 0, { notation: "fixed", precision: options?.precision })
  }
}
