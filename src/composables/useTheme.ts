import type { ThemeColorOption, ThemeMode } from '@/configs/theme'
import { themeColorOptions } from '@/configs/theme'

/**
 * 统一主题管理组合式 API
 * @description 支持系统主题、手动切换、主题色与导航栏同步
 */
export function useTheme() {
  const store = useThemeStore()
  const showThemeColorSheet = shallowRef(false)
  const {
    theme,
    isDark,
    followSystem,
    hasUserSet,
    currentThemeColor,
    themeVars,
    navigationBarColor,
  } = storeToRefs(store)

  onBeforeMount(() => {
    store.initTheme()
  })

  onShow(() => {
    store.setNavigationBarColor()
  })

  function toggleTheme(mode?: ThemeMode, isFollow = false) {
    store.toggleTheme(mode, isFollow)
  }

  function openThemeColorPicker() {
    showThemeColorSheet.value = true
  }

  function closeThemeColorPicker() {
    showThemeColorSheet.value = false
  }

  function selectThemeColor(option: ThemeColorOption) {
    store.setCurrentThemeColor(option)
    closeThemeColorPicker()
  }

  return {
    theme,
    isDark,
    followSystem,
    hasUserSet,
    currentThemeColor,
    themeVars,
    navigationBarColor,
    showThemeColorSheet,
    themeColorOptions,
    initTheme: store.initTheme,
    toggleTheme,
    setFollowSystem: store.setFollowSystem,
    openThemeColorPicker,
    closeThemeColorPicker,
    selectThemeColor,
  }
}
