import { defineStore } from "pinia"

import { pagesList } from "@/router/routes"

export interface TabbarItem {
  name: string
  value: number | null
  active: boolean
}

export const useTabbarStore = defineStore("tabbar", {
  state: (): { tabbarItems: TabbarItem[] } => {
    return ({
      tabbarItems: pagesList.filter(page => page.tabbar).map(page => ({
        name: page?.name,
        value: null,
        active: false,
      })) as TabbarItem[],
    })
  },
  getters: {
    getTabbarItems: (state) => {
      return state.tabbarItems
    },
    getActive: (state) => {
      const item = state.tabbarItems.find(item => item.active)
      return item || state.tabbarItems[0]
    },
    getTabbarItemValue: (state) => {
      return (name?: string) => {
        const item = state.tabbarItems.find(item => item.name === name)
        return item && item.value ? item.value : null
      }
    },
  },
  actions: {
    setTabbarItem(name: string, value: number) {
      const tabbarItem = this.tabbarItems.find(item => item.name === name)
      if (tabbarItem)
        tabbarItem.value = value
    },
    setTabbarItemActive(name?: string) {
      this.tabbarItems.forEach((item) => {
        if (item.name === name)
          item.active = true
        else
          item.active = false
      })
    },
  },
})
