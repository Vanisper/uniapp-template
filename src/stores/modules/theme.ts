import type { ThemeColorOption, ThemeMode } from '@/configs/theme'
import { createThemeConfig } from '@/configs/theme'
import themeData from '@/theme.json'

const colorFixMap: Record<string, string> = {
  'black': '#000000',
  'white': '#ffffff',
  '#000': '#000000',
  '#FFF': '#ffffff',
  '#fff': '#ffffff',
}

export const useThemeStore = defineStore('theme', () => {
  const defaultConfig = createThemeConfig()

  const theme = shallowRef<ThemeMode>(defaultConfig.theme)
  const currentThemeColor = shallowRef<ThemeColorOption>(defaultConfig.currentThemeColor)
  const followSystem = shallowRef(true)
  const hasUserSet = shallowRef(false)
  const isThemeChangeListening = shallowRef(false)

  const isDark = computed(() => theme.value === 'dark')
  const themeVars = computed(() => ({
    colorTheme: currentThemeColor.value.primary,
  }))
  const navigationBarColor = computed(() => {
    const navTxtStyle = themeData[theme.value].navTxtStyle
    const navBgColor = themeData[theme.value].navBgColor

    const frontColor = colorFixMap[navTxtStyle] ?? navTxtStyle
    const backgroundColor = colorFixMap[navBgColor] ?? navBgColor

    return { frontColor, backgroundColor }
  })

  function getSystemTheme(): ThemeMode {
    try {
      // #ifdef MP-WEIXIN
      const appBaseInfo = uni.getAppBaseInfo()
      if (appBaseInfo && appBaseInfo.theme) {
        return appBaseInfo.theme as ThemeMode
      }
      // #endif

      // #ifndef MP-WEIXIN
      const systemInfo = uni.getSystemInfoSync()
      if (systemInfo && systemInfo.theme) {
        return systemInfo.theme as ThemeMode
      }
      // #endif
    }
    catch (error) {
      console.warn('获取系统主题失败:', error)
    }

    return 'light'
  }

  function setNavigationBarColor() {
    uni.setNavigationBarColor(navigationBarColor.value)
  }

  function setTheme(themeMode: ThemeMode, isFollow = false) {
    theme.value = themeMode

    if (!isFollow) {
      hasUserSet.value = true
      followSystem.value = false
    }

    setNavigationBarColor()
  }

  function ensureThemeChangeListener() {
    if (isThemeChangeListening.value || typeof uni === 'undefined' || !uni.onThemeChange) {
      return
    }

    uni.onThemeChange((res) => {
      if (followSystem.value) {
        setTheme(res.theme as ThemeMode, true)
      }
    })

    isThemeChangeListening.value = true
  }

  function initTheme() {
    ensureThemeChangeListener()

    if (hasUserSet.value && !followSystem.value) {
      setNavigationBarColor()
      return
    }

    theme.value = getSystemTheme()
    if (!hasUserSet.value) {
      followSystem.value = true
    }

    setNavigationBarColor()
  }

  function setFollowSystem(follow: boolean) {
    followSystem.value = follow

    if (follow) {
      hasUserSet.value = false
      initTheme()
      return
    }

    hasUserSet.value = true
  }

  function setCurrentThemeColor(color: ThemeColorOption) {
    currentThemeColor.value = color
  }

  function toggleTheme(mode?: ThemeMode, isFollow = false) {
    setTheme(mode ?? (theme.value === 'light' ? 'dark' : 'light'), isFollow)
  }

  return {
    theme,
    currentThemeColor,
    followSystem,
    hasUserSet,
    isDark,
    themeVars,
    navigationBarColor,
    getSystemTheme,
    initTheme,
    setTheme,
    toggleTheme,
    setFollowSystem,
    setCurrentThemeColor,
    setNavigationBarColor,
  }
}, { persist: true })
