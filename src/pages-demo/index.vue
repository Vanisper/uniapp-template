<script setup lang="ts">
import AppFooter from './components/AppFooter.vue'
import AppLogos from './components/AppLogos.vue'
import InputEntry from './components/InputEntry.vue'

const appVersion = __APP_VERSION__
const nodeEnv = __NODE_ENV__
</script>

<template>
  <AppLogos />
  <InputEntry />
  <view c-coolgray>
    v{{ appVersion }}
  </view>
  <view c-indigo>
    mode: {{ nodeEnv }}
  </view>
  <AppFooter />
</template>
