export {}

declare global {
// #region 由 vite-define 注入
  /**
   * uni-app 运行平台
   * @description 如：`app`、`mp-weixin`、`web`
   */
  const __UNI_PLATFORM__: string
  /**
   * 当前运行环境
   * @description 如：`development`、`production`、`test` - 与 `import.meta.env.MODE` 相同
   */
  const __NODE_ENV__: 'development' | 'production' | 'test'
  /**
   * 当前应用版本号
   * @description 与 `package.json` 的 `version` 相同
   */
  const __APP_VERSION__: string
  /**
   * 当前应用版本编码
   * @description 与 `package.json` 的 `versionCode` 相同；主要是 uniapp manifest 所需的版本相关配置
   * - `versionCode` 是数字，故其更新规则是：每次版本发布，`versionCode` 都应自增 1
   * - https://blog.csdn.net/ItJavawfc/article/details/45286589
   */
  const __APP_VERSION_CODE__: number
  // #endregion
}
