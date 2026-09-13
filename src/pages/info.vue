<script setup lang="ts">
definePage({ style: { navigationBarTitleText: '关于拾页', navigationStyle: 'default' } })
const { go } = usePages()
</script>

<template>
  <scroll-view scroll-y class="journal-scroll" :show-scrollbar="false">
    <view class="journal-body info">
      <view class="info__mark"><text class="i-carbon-sprout" /></view>
      <text class="journal-kicker">LITTLE THINGS, WELL KEPT</text>
      <text class="journal-title">拾起日常的每一页</text>
      <text class="info__copy">一个安静的地方，读几篇文章，记一点想法，收藏那些让你停下来的瞬间。</text>
      <view class="info__card"><text class="info__heading">关于这些内容</text><text class="info__copy">文章与初始笔记为示例内容。你新建的笔记和收藏仅保存在当前设备，没有账号注册或云端同步。</text></view>
      <view class="info__card"><text class="info__heading">也为开发者留了一页</text><text class="info__copy">通过独立测试中心体验组件调用、页面参数与计数状态。</text><button class="journal-link" @click="go('/packages/demo/pages/index')">打开测试中心 <text class="i-carbon-arrow-right" /></button><button class="journal-link" @click="go('/pages/appearance')">查看底栏版式 <text class="i-carbon-arrow-right" /></button></view>
      <text class="info__footer">MADE FOR EVERYDAY INSPIRATION</text>
    </view>
  </scroll-view>
</template>

<style scoped lang="scss">
.info { padding-top: 46px; }
.info__mark { display: flex; align-items: center; justify-content: center; width: 65px; height: 65px; margin-bottom: 28px; border-radius: 20px; color: #257864; background: #e2ecdf; font-size: 36px; }
.info__copy { display: block; margin: 16px 0; color: #7f8a81; font-size: 13px; line-height: 2; }
.info__card { padding: 22px; margin-top: 22px; border: 1px solid var(--app-line); border-radius: 16px; background: var(--app-surface); }
.info__heading { font-size: 15px; font-weight: 600; }
.info__card .journal-link { margin-top: 6px; }
.info__footer { display: block; padding: 40px 0 10px; color: #acb4aa; font-size: 9px; letter-spacing: 1px; }
</style>
