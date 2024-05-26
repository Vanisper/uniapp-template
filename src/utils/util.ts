import dayjs from "dayjs"

const formatTime = (date: dayjs.ConfigType, template?: string) => dayjs(date).format(template)

function getDayRange(date: dayjs.ConfigType = dayjs()) {
  const start = dayjs(date).startOf("day")
  const end = dayjs(date).endOf("day")
  return [start, end]
}

function getWeekRange(date: dayjs.ConfigType = dayjs()) {
  const start = dayjs(date).startOf("week")
  const end = dayjs(date).endOf("week")
  return [start, end]
}

function getMonthRange(date: dayjs.ConfigType = dayjs()) {
  const start = dayjs(date).startOf("month")
  const end = dayjs(date).endOf("month")
  return [start, end]
}

function getYearRange(date: dayjs.ConfigType = dayjs()) {
  const start = dayjs(date).startOf("year")
  const end = dayjs(date).endOf("year")
  return [start, end]
}

/**
 * 格式化价格数额为字符串
 * 可对小数部分进行填充，默认不填充
 * @param price 价格数额，以分为单位!
 * @param fill 是否填充小数部分 0-不填充 1-填充第一位小数 2-填充两位小数
 */
function priceFormat(price: unknown, fill = 0) {
  if (Number.isNaN(price) || price === null || price === Number.POSITIVE_INFINITY)
    return price

  let priceFormatValue: string | number = Math.round(Number.parseFloat(`${price}`) * 10 ** 8) / 10 ** 8 // 恢复精度丢失
  priceFormatValue = `${Math.ceil(priceFormatValue) / 100}` // 向上取整，单位转换为元，转换为字符串
  if (fill > 0) {
    // 补充小数位数
    if (!priceFormatValue.includes("."))
      priceFormatValue = `${priceFormatValue}.`

    const n = fill - priceFormatValue.split(".")[1]?.length
    for (let i = 0; i < n; i++)
      priceFormatValue = `${priceFormatValue}0`
  }
  return priceFormatValue
}

/**
 * 获取cdn裁剪后链接
 *
 * @param {string} url 基础链接
 * @param {number} width 宽度，单位px
 * @param {number} [height] 可选，高度，不填时与width同值
 */
function cosThumb(url: string, width: number, height = width) {
  if (url.includes("?"))
    return url

  if (url.indexOf("http://") === 0)
    url = url.replace("http://", "https://")

  return `${url}?imageMogr2/thumbnail/${~~width}x${~~height}`
}

function get(source: { [x: string]: any } | null | undefined, paths: string | (string | number)[], defaultValue: any) {
  if (typeof paths === "string")
    paths = paths.replace(/\[/g, ".").replace(/\]/g, "").split(".").filter(Boolean)

  const { length } = paths
  let index = 0
  while (source != null && index < length)
    source = source[paths[index++]]

  return source === undefined || index === 0 ? defaultValue : source
}
let systemWidth = 0
/** 获取系统宽度，为了减少启动消耗所以在函数里边做初始化 */
export function loadSystemWidth() {
  if (systemWidth)
    return systemWidth

  try {
    systemWidth = uni.getSystemInfoSync().screenWidth
  }
  catch (e) {
    systemWidth = 0
  }
  return systemWidth
}

/**
 * 转换rpx为px
 *
 * @description
 * 什么时候用？
 * - 布局(width: 172rpx)已经写好, 某些组件只接受px作为style或者prop指定
 *
 */
function rpx2px(rpx: number, round = false) {
  loadSystemWidth()

  // px / systemWidth = rpx / 750
  const result = (rpx * systemWidth) / 750

  if (round)
    return Math.floor(result)

  return result
}

/**
 * 手机号码*加密函数
 * @param {string} phone 电话号
 * @returns {string} 加密后的电话号码
 */
function phoneEncryption(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")
}

// 内置手机号正则字符串
const innerPhoneReg = "^1(?:3\\d|4[4-9]|5[0-35-9]|6[67]|7[0-8]|8\\d|9\\d)\\d{8}$"

/**
 * 手机号正则校验
 * @param phone 手机号
 * @returns true - 校验通过 false - 校验失败
 */
function phoneRegCheck(phone: string) {
  const phoneRegExp = new RegExp(innerPhoneReg)
  return phoneRegExp.test(phone)
}

// 生成当前时间 2021-10-25 23:34:22
function getNowTime(format = "YYYY-MM-DD HH:mm:ss") {
  return dayjs().format(format)
}

// uuid
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export { formatTime, getDayRange, getWeekRange, getMonthRange, getYearRange, priceFormat, cosThumb, get, rpx2px, phoneEncryption, phoneRegCheck, getNowTime, uuid }
