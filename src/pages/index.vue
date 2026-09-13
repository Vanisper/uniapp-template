<script setup lang="ts">
import DiscoveryView from '@/features/journal/components/DiscoveryView.vue'

definePage({
  layout: 'tabbar',
  tabBar: {
    text: '发现',
    index: -1,
    iconPath: 'static/tabbar/discover.png',
    selectedIconPath: 'static/tabbar/discover-active.png',
  },
  style: { navigationBarTitleText: '发现', navigationStyle: 'custom' },
})
</script>

<template>
  <DiscoveryView />
</template>
