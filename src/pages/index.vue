<script setup lang="ts">
definePage({
  type: 'home',
})

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
</template>
