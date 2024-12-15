<script setup lang="ts">
import { navigateTo } from '@/utils'
import { ref } from 'vue'

const name = ref('')
const show = ref(false)

function handleClick() {
  show.value = true
  setTimeout(() => {
    show.value = false
  }, 3000)
}
</script>

<template>
  <view class="input-box">
    <input v-model="name" placeholder="What's your name?">
  </view>
  <button :disabled="!name" @click="handleClick">
    Hello
  </button>
  <button style="margin-top: 10px;" @click="navigateTo('/pages-sub1/index')">
    前往子包1
  </button>

  <view v-show="show" class="popup">
    <text class="popup_label">
      Hello{{ ` ${name}` }} 👏
    </text>
  </view>
</template>

<style scoped lang="scss">
.input-box {
  margin: 1rem;
  padding: 0.5rem;
  border-bottom: 1px solid gray;
}

.popup {
  position: fixed;
  top: 2rem;
  left: 0px;
  right: 0px;

  .popup_label {
    padding: 0.5rem 2rem;
    background: gray;
    border-radius: 8px;
  }
}
</style>
