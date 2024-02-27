<script lang="ts" setup>
import { PageWraperProps } from "./type"
import { pagesList } from "@/router/routes"

// https://blog.csdn.net/weixin_42678675/article/details/121023008
// 3.3以下版本的直接多写个script标签导出
// 3.3以上的使用defineOptions宏
defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: "shared",
  },
})

const props = defineProps(PageWraperProps)

const router = useRouter()
const route = useRoute()

const tabbarStore = useTabbarStore()

const themeVars = reactive({
  colorTheme: "#fa4126",
})

function handleChange({ value }: { value: string }) {
  tabbarStore.setTabbarItemActive(value)
  router.pushTab({ name: value })
}

onShow(() => {
  nextTick(() => {
    tabbarStore.setTabbarItemActive(route.name)
  })
})
</script>

<template>
  <wd-config-provider :theme-vars="themeVars">
    <wd-notify />
    <wd-toast />
    <wd-message-box />
    <!-- #ifdef MP-WEIXIN -->
    <privacy-popup />
    <!-- #endif -->
    <slot />

    <wd-tabbar :model-value="tabbarStore.getActive.name" bordered safe-area-inset-bottom placeholder fixed @change="handleChange">
      <wd-tabbar-item
        v-for="(page, index) in pagesList.filter(v => v.tabbar)" :key="index"
        :name="page.name" :value="tabbarStore.getTabbarItemValue(page.name)" :title="page.text" :icon="page.icon"
      />
    </wd-tabbar>
  </wd-config-provider>
</template>

<style lang="scss" scoped></style>
