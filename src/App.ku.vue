<script setup lang="ts">
function handleClickGithub() {
  if (window?.open) {
    window.open('https://github.com/uni-ku/root')
  }
  else {
    uni.showToast({
      icon: 'none',
      title: '请使用浏览器打开',
    })
  }
}
</script>

<template>
  <app-page-wrapper>
    <ku-root-view />
    <div class="root-bar">
      <span>Root component By</span>
      <span class="color-blue" @click="handleClickGithub">uni-ku/root</span>
    </div>
  </app-page-wrapper>
</template>

<style lang="scss" scoped>
.root-bar {
  position: absolute;
  bottom: 50px;
  left: 0;
  width: 100%;
  height: 40px;
  background-color: #f5f5f5;
  opacity: 0.5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #999;
  font-size: 14px;
  line-height: 40px;
  text-align: center;
  box-sizing: border-box;
  padding: 0 20px;
  z-index: 1;
  pointer-events: none;

  .color-blue {
    color: #409eff;
    cursor: pointer;
  }
}
</style>
