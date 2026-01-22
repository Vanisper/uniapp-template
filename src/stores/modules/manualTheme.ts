// Borrowed from: https://github.com/wot-ui/wot-starter/blob/main/src/store/manualThemeStore.ts
import type { ThemeColorOption, ThemeMode } from '@/configs/theme'
import { defineStore } from 'pinia'
import { THEME_CONFIG } from '@/configs/theme'
import themeData from '@/theme.json'

/**
 * 完整版主题状态管理
 * 支持手动切换主题、主题色选择、跟随系统主题等完整功能
 */
export const useManualThemeStore = defineStore('manualTheme', {
  state: () => ({
    ...THEME_CONFIG,
    /** 是否跟随系统主题 */
    followSystem: true,
    /** 用户是否手动设置过主题 */
    hasUserSet: false,
  }),

  getters: {
    isDark: state => state.theme === 'dark',
  },

  actions: {
    /**
     * 手动切换主题
     * @param mode 指定主题模式，不传则自动切换
     * @param isFollw 是否是跟随系统
     */
    toggleTheme(mode?: ThemeMode, isFollw: boolean = false) {
      this.theme = mode || (this.theme === 'light' ? 'dark' : 'light')
      if (!isFollw) {
        // 如果不是跟随系统，是手动切换
        this.hasUserSet = true // 标记用户已手动设置
        this.followSystem = false // 不再跟随系统
      }
      this.setNavigationBarColor()
    },

    /**
     * 设置是否跟随系统主题
     * @param follow 是否跟随系统
     */
    setFollowSystem(follow: boolean) {
      this.followSystem = follow
      if (follow) {
        this.hasUserSet = false
        this.initTheme() // 重新获取系统主题
      }
    },

    /**
     * 设置导航栏颜色
     */
    setNavigationBarColor() {
      // 颜色修正，setNavigationBarColor 对颜色字符串格式有严格要求
      const colorFixMap = {
        'black': '#000000',
        'white': '#ffffff',
        '#000': '#000000',
        '#FFF': '#ffffff',
        '#fff': '#ffffff',
      } as Record<string, string>

      const navTxtStyle = themeData[this.theme].navTxtStyle
      const navBgColor = themeData[this.theme].navBgColor

      const frontColor = colorFixMap[navTxtStyle] ?? navTxtStyle
      const backgroundColor = colorFixMap[navBgColor] ?? navBgColor

      uni.setNavigationBarColor({
        frontColor,
        backgroundColor,
      })
      // uni.setNavigationBarColor({
      //   frontColor: this.theme === 'light' ? '#000000' : '#ffffff',
      //   backgroundColor: this.theme === 'light' ? '#ffffff' : '#000000',
      // })
    },

    /**
     * 设置主题色
     * @param color 主题色选项
     */
    setCurrentThemeColor(color: ThemeColorOption) {
      this.currentThemeColor = color
      this.themeVars.colorTheme = color.primary
    },

    /**
     * 获取系统主题
     * @returns 系统主题模式
     */
    getSystemTheme(): ThemeMode {
      try {
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
      }
      catch (error) {
        console.warn('获取系统主题失败:', error)
      }
      return 'light' // 默认返回 light
    },

    /**
     * 初始化主题
     */
    initTheme() {
      // 如果用户已手动设置且不跟随系统，保持当前主题
      if (this.hasUserSet && !this.followSystem) {
        console.log('使用用户设置的主题:', this.theme)
        this.setNavigationBarColor()
        return
      }

      // 获取系统主题
      const systemTheme = this.getSystemTheme()

      // 如果是首次启动或跟随系统，使用系统主题
      if (!this.hasUserSet || this.followSystem) {
        this.theme = systemTheme
        if (!this.hasUserSet) {
          this.followSystem = true
          console.log('首次启动，使用系统主题:', this.theme)
        }
        else {
          console.log('跟随系统主题:', this.theme)
        }
      }

      this.setNavigationBarColor()
    },
  },
})
