<script setup lang="ts">
import { shallowRef } from 'vue'
import TabbarAnimated from '@/components/Tabbar/Animated/index.vue'
import Tabbar from '@/components/Tabbar/index.vue'
import TabbarRaised from '@/components/Tabbar/Raised/index.vue'

definePage({ style: { navigationBarTitleText: '底栏版式', navigationStyle: 'custom' } })
const colors = { normal: '#89948f', active: '#257864' }
const classic = shallowRef('discover')
const animated = shallowRef('discover')
const raised = shallowRef('discover')
const items = [
  { value: 'discover', text: '发现', iconPath: '/static/tabbar/discover.png', selectedIconPath: '/static/tabbar/discover-active.png' },
  { value: 'notes', text: '笔记', iconPath: '/static/tabbar/notes.png', selectedIconPath: '/static/tabbar/notes-active.png' },
  { value: 'profile', text: '我的', iconPath: '/static/tabbar/profile.png', selectedIconPath: '/static/tabbar/profile-active.png' },
]
</script>

<template>
  <scroll-view scroll-y class="journal-scroll" :show-scrollbar="false">
    <view class="journal-body">
      <text class="journal-kicker">THE DETAILS MATTER</text><text class="journal-title">找到合适的节奏</text><view class="appearance-intro">三种图文底栏，点击下方标签即可体验。</view>
      <view class="journal-section-heading"><text class="journal-section-title">01 · 浮起导航</text><text class="journal-muted">随选择移动</text></view>
      <view class="appearance-preview">
        <view class="appearance-preview__content">
          <text class="appearance-preview__title">{{ items.find(item => item.value === raised)?.text }}</text>
          <text>让此刻的选择，轻轻浮出。</text>
        </view>
        <TabbarRaised :value="raised" :list="items" :height="72" :color="colors.normal" :active-color="colors.active" @change="raised = $event.value" />
      </view>
      <view class="journal-section-heading"><text class="journal-section-title">02 · 简洁图文</text><text class="journal-muted">即时切换</text></view>
      <view class="appearance-preview"><view class="appearance-preview__content"><text class="appearance-preview__title">{{ items.find(item => item.value === classic)?.text }}</text><text>少一点装饰，让内容更突出。</text></view><Tabbar :value="classic" :list="items" :height="64" :color="colors.normal" :active-color="colors.active" @change="classic = $event.value" /></view>
      <view class="journal-section-heading"><text class="journal-section-title">03 · 胶囊强调</text><text class="journal-muted">柔和过渡</text></view>
      <view class="appearance-preview"><view class="appearance-preview__content"><text class="appearance-preview__title">{{ items.find(item => item.value === animated)?.text }}</text><text>用轻盈的移动，回应每一次选择。</text></view><TabbarAnimated :value="animated" :list="items" :height="64" :color="colors.normal" :active-color="colors.active" @change="animated = $event.value" /></view>
      <view class="appearance-tip"><text class="i-carbon-information" /><text>这里的切换仅用于版式预览，不会离开当前页面。</text></view>
    </view>
  </scroll-view>
</template>

<style scoped lang="scss">
@use '../styles/journal.scss';

.appearance-intro { margin-top: 12px; color: #88928c; font-size: 12px; line-height: 1.9; }
.appearance-preview { position: relative; overflow: hidden; border: 1px solid var(--app-line); border-radius: 18px; background: #eef3ed; }
.appearance-preview__content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; height: 145px; color: #9ba79e; background: #eef3ed; font-size: 11px; }
.appearance-preview__title { color: #536e58; font-size: 24px; font-weight: 600; }
.appearance-tip { display: flex; align-items: center; gap: 8px; margin-top: 26px; color: #94a092; font-size: 11px; line-height: 1.8; }
</style>
