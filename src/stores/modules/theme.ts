// Borrowed from: https://github.com/wot-ui/wot-starter/blob/main/src/store/themeStore.ts
import type { ThemeMode } from '@/configs/theme'
import { defineStore } from 'pinia'
import { THEME_CONFIG } from '@/configs/theme'

/**
 * 简化版系统主题状态管理
 * 仅支持跟随系统主题，不提供手动切换功能
 * 导航栏颜色通过 theme.json 自动处理
 */
export const useThemeStore = defineStore('theme', {
  state: () => ({ ...THEME_CONFIG }),

  getters: {
    isDark: state => state.theme === 'dark',
  },

  actions: {
    /**
     * 获取系统主题
     * @returns 系统主题模式
     */
    getSystemTheme(): ThemeMode {
      // #ifdef MP-WEIXIN
      // 微信小程序使用 getAppBaseInfo
      const appBaseInfo = uni.getAppBaseInfo()
      if (appBaseInfo && appBaseInfo.theme) {
        return appBaseInfo.theme as ThemeMode
      }
      // #endif

      // #ifndef MP-WEIXIN
      // 其他平台使用 getSystemInfoSync
      const systemInfo = uni.getSystemInfoSync()
      if (systemInfo && systemInfo.theme) {
        return systemInfo.theme as ThemeMode
      }
      // #endif

      return 'light' // 默认返回 light
    },

    /**
     * 设置主题（仅内部使用）
     * @param theme 主题模式
     */
    setTheme(theme: ThemeMode) {
      this.theme = theme
    },

    /**
     * 初始化系统主题
     */
    initSystemTheme() {
      const systemTheme = this.getSystemTheme()
      this.theme = systemTheme
      console.log('初始化系统主题:', this.theme)
    },
  },
})
