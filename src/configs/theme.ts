// Borrowed from: https://github.com/wot-ui/wot-starter/blob/main/src/composables/types/theme.ts
/**
 * 主题类型
 */
export type ThemeMode = 'light' | 'dark'

/**
 * 主题色选项接口
 */
export interface ThemeColorOption {
  name: string
  value: string
  primary: string
}

type ThemeVars<T extends Record<string, any>> = {
  colorTheme: ThemeColorOption['primary']
} & T

interface IThemeConfig<T extends Record<string, any> = Record<string, any>> {
  theme: ThemeMode
  currentThemeColor: ThemeColorOption
  themeVars: ThemeVars<T>
  tabbar: {
    /** tabbar 模式，默认值为 default */
    mode: 'default' | 'custom'
    /**
     * tabbar 高度 - 单位 `px`
     * @default 50
     */
    height: number
  }
  navbar: {
    /**
     * navbar 高度 - 单位 `px` | 原生高度为 44px
     * @default 44
     */
    height: number
  }
}

/**
 * 预定义的主题色选项
 */
export const themeColorOptions: ThemeColorOption[] = [
  { name: '默认蓝', value: 'blue', primary: '#4D7FFF' },
  { name: '活力橙', value: 'orange', primary: '#FF7D00' },
  { name: '薄荷绿', value: 'green', primary: '#07C160' },
  { name: '樱花粉', value: 'pink', primary: '#FF69B4' },
  { name: '紫罗兰', value: 'purple', primary: '#8A2BE2' },
  { name: '朱砂红', value: 'red', primary: '#FF4757' },
]

const currentThemeColor = themeColorOptions[0]

/** 主题配置 */
export const THEME_CONFIG = Object.freeze<IThemeConfig>({
  theme: 'light',
  currentThemeColor,
  themeVars: {
    colorTheme: currentThemeColor.primary,
  },
  tabbar: {
    mode: 'default',
    height: 50,
  },
  navbar: {
    height: 56,
  },
})
