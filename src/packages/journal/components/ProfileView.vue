<script setup lang="ts">
import { useJournal } from '../useJournal'
import JournalHeader from './JournalHeader.vue'

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const { notes, savedStoryIds } = useJournal()

function openNotebook() {
  uni.switchTab({ url: '/pages/notes' })
}

function openSaved() {
  uni.navigateTo({ url: '/packages/journal/pages/saved' })
}

function openTesting() {
  uni.navigateTo({ url: '/packages/demo/pages/index' })
}

function openInfo() {
  uni.navigateTo({ url: '/packages/journal/pages/info' })
}
</script>

<template>
  <view class="journal-screen profile-screen">
    <view class="profile-topbar">
      <JournalHeader title="个人主页" profile />
    </view>
    <scroll-view scroll-y class="journal-scroll" :show-scrollbar="false">
      <view class="profile-hero">
        <view class="profile-hero-inner">
          <view class="profile-identity">
            <view class="profile-avatar"><text>拾</text></view>
            <view>
              <text class="profile-name">拾页用户</text>
              <text class="profile-bio">记录日常，也收藏灵感</text>
              <view class="profile-device"><view class="profile-device-icon" i-carbon:checkmark /><text>保存在此设备</text></view>
            </view>
          </view>
          <view class="profile-stats">
            <button class="profile-stat" @click="openNotebook">
              <text class="profile-stat-number">{{ notes.length }}</text>
              <text class="profile-stat-label">我的笔记</text>
            </button>
            <view class="profile-stat-divider" />
            <button class="profile-stat" @click="openSaved">
              <text class="profile-stat-number">{{ savedStoryIds.length }}</text>
              <text class="profile-stat-label">我的收藏</text>
            </button>
          </view>
        </view>
      </view>

      <view class="journal-body profile-body">
        <text class="profile-section-title">我的空间</text>
        <view class="profile-menu">
          <button class="profile-menu-row" @click="openNotebook">
            <view class="profile-menu-icon"><view i-carbon:notebook /></view>
            <view class="profile-menu-copy"><text>我的笔记</text><text class="profile-menu-hint">整理那些闪过的念头</text></view>
            <view class="profile-chevron" i-carbon:chevron-right />
          </button>
          <button class="profile-menu-row" @click="openSaved">
            <view class="profile-menu-icon profile-menu-icon--sand"><view i-carbon:bookmark /></view>
            <view class="profile-menu-copy"><text>我的收藏</text><text class="profile-menu-hint">值得再读一遍的好内容</text></view>
            <view class="profile-chevron" i-carbon:chevron-right />
          </button>
        </view>

        <text class="profile-section-title profile-section-title--more">更多</text>
        <view class="profile-menu">
          <button class="profile-menu-row profile-menu-row--compact" @click="openTesting">
            <view class="profile-menu-icon profile-menu-icon--plain"><view i-carbon:development /></view>
            <view class="profile-menu-copy"><text>测试中心</text></view>
            <text class="profile-menu-trailing">组件与功能</text>
            <view class="profile-chevron" i-carbon:chevron-right />
          </button>
          <button class="profile-menu-row profile-menu-row--compact" @click="openInfo">
            <view class="profile-menu-icon profile-menu-icon--plain"><view i-carbon:information /></view>
            <view class="profile-menu-copy"><text>关于拾页</text></view>
            <view class="profile-chevron" i-carbon:chevron-right />
          </button>
        </view>

        <view class="profile-signature">
          <text class="profile-signature-name">拾页</text>
          <text>拾起日常的一页</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
@use '../styles/journal.scss';

.profile-screen { background: var(--app-bg); }
.profile-topbar, .profile-hero { background: #ecefe7; }
.profile-hero { border-radius: 0 0 25px 25px; }
.profile-hero-inner { max-width: 640px; box-sizing: border-box; margin: 0 auto; padding: 24px 25px 22px; }
.profile-identity { display: flex; align-items: center; gap: 18px; }
.profile-avatar { display: flex; flex-shrink: 0; align-items: center; justify-content: center; width: 71px; height: 71px; border: 4px solid #fff; border-radius: 50%; color: #fff; background: #749785; font-family: 'Songti SC', 'STSong', serif; font-size: 32px; transform: rotate(-6deg); }
.profile-name { display: block; color: #263d30; font-size: 23px; font-weight: 650; }
.profile-bio { display: block; margin-top: 8px; color: #788678; font-size: 12px; }
.profile-device { display: inline-flex; align-items: center; gap: 4px; margin-top: 11px; color: #688772; font-size: 10px; }
.profile-device-icon { font-size: 11px; }
.profile-stats { display: flex; align-items: center; margin-top: 25px; }
.profile-stat { display: flex; flex: 1; flex-direction: column; align-items: center; padding: 7px 0; color: #2f4b39; background: transparent; }
.profile-stat-number { font-size: 27px; font-weight: 600; line-height: 1.4; }
.profile-stat-label { margin-top: 5px; color: #7a877b; font-size: 11px; }
.profile-stat-divider { width: 1px; height: 29px; background: #dbe2d7; }
.profile-body { padding-top: 26px; }
.profile-section-title { display: block; margin: 0 0 12px 2px; color: #7f8a82; font-size: 12px; }
.profile-section-title--more { margin-top: 26px; }
.profile-menu { overflow: hidden; padding: 0 17px; border: 1px solid var(--app-line); border-radius: 17px; background: var(--app-surface); }
.profile-menu-row { display: flex; align-items: center; gap: 13px; width: 100%; padding: 20px 0; color: var(--app-ink); background: transparent; text-align: left; }
.profile-menu-row + .profile-menu-row { border-top: 1px solid var(--app-line); }
.profile-menu-row--compact { padding: 16px 0; }
.profile-menu-icon { display: flex; flex-shrink: 0; align-items: center; justify-content: center; width: 35px; height: 35px; border-radius: 10px; color: #5e896c; background: #eff5ee; font-size: 18px; }
.profile-menu-icon--sand { color: #a48961; background: #f7f1e8; }
.profile-menu-icon--plain { color: #8c9991; background: #f4f6f2; }
.profile-menu-copy { display: flex; flex: 1; flex-direction: column; gap: 6px; font-size: 14px; }
.profile-menu-hint { color: #9aa299; font-size: 10px; }
.profile-menu-trailing { color: #a1aaa2; font-size: 10px; }
.profile-chevron { flex-shrink: 0; color: #b2bbb3; font-size: 15px; }
.profile-signature { display: flex; flex-direction: column; align-items: center; gap: 7px; margin-top: 34px; color: #b1baaf; font-size: 10px; letter-spacing: 2px; }
.profile-signature-name { font-family: 'Songti SC', 'STSong', serif; font-size: 21px; letter-spacing: 5px; }
</style>
