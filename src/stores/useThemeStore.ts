import { defineStore } from "pinia"

export const useThemeStore = defineStore("theme", () => {
  const currentTheme = ref<"light" | "dark">("light")

  function updateTheme(theme: "light" | "dark" | string) {
    currentTheme.value = theme === "dark" ? "dark" : "light"
  }

  function resetTheme() {
    uni.getSystemInfo({
      success: (res) => {
        updateTheme(res.theme || "light")
      },
    })
  }

  return {
    currentTheme, // 变量的话如果要保留响应式，不要直接解构
    resetTheme,
    updateTheme,
  }
})
