<!-- eslint-disable unused-imports/no-unused-vars -->
<!-- eslint-disable no-console -->

<script setup lang="ts">
import { onLaunch } from "@dcloudio/uni-app"
import useUpdateManager from "./composables/useUpdateManager"

// 小程序更新管理
useUpdateManager()

onLaunch((ctx) => {
  console.log("App Launch")
  uni.hideTabBar() // 隐藏原生tabbar
})
</script>
