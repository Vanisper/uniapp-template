<script setup lang="ts">
import ProfileView from '@/features/journal/components/ProfileView.vue'

definePage({
  layout: 'tabbar',
  tabBar: {
    text: '我的',
    index: 2,
    iconPath: 'static/tabbar/profile.png',
    selectedIconPath: 'static/tabbar/profile-active.png',
  },
  style: {
    navigationBarTitleText: '个人主页',
    navigationStyle: 'custom',
  },
})
</script>

<template>
  <ProfileView />
</template>
