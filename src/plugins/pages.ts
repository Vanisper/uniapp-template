import type { App } from 'vue'
import { syncPageStack } from '@/composables/usePages'

const installedApps = new WeakSet<App>()
let interceptorsInstalled = false

/**
 * 安装页面状态同步
 *
 * @description 在创建应用后、挂载前调用，同一应用重复调用不会重复注册
 */
export function setupPages(app: App) {
  if (installedApps.has(app)) {
    return
  }

  installedApps.add(app)
  app.mixin({
    // 原生 tab 点击和系统返回不一定经过导航 API
    onShow: syncPageStack,
    onReady: syncPageStack,
  })

  if (!interceptorsInstalled) {
    for (const method of ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab', 'navigateBack']) {
      uni.addInterceptor(method, { complete: syncPageStack })
    }
    interceptorsInstalled = true
  }
}
