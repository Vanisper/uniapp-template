<script setup lang="ts">
import AppFooter from '@/components/AppFooter.vue'
import AppLogos from '@/components/AppLogos.vue'
import InputEntry from '@/components/InputEntry.vue'

const appVersion = __APP_VERSION__
</script>

<template>
  <view px-10 py-20 text-center>
    <AppLogos />
    <InputEntry />
    <view c-coolgray>
      v{{ appVersion }}
    </view>
    <AppFooter />
  </view>
</template>
