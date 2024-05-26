<script lang="ts" setup>
import { useNotify, useToast } from "wot-design-uni"

const toast = useToast()
const route = useRoute()
const { showNotify, closeNotify } = useNotify()

const authStore = useAuthStore()

const tabs = ref(["内部组织", "外部组织"])
const tab = ref(tabs.value[0])

const notifySafeStore = useNotifySafeStore()
notifySafeStore.weixinFix(route.name || "")

function tabChange(e: string) {
  showNotify({
    safeHeight: notifySafeStore.safeHeight,
    message: tab.value,
  })
}

// #region 搜索框配置
const searchValue = ref<string>("")

function searchFocus() {
  toast.info("搜索框获取焦点")
}

function searchBlur() {
  toast.info("搜索框失去焦点")
}

function searchAction() {
  toast.info("搜索框点击搜索")
}

function searchClear() {
  toast.info("搜索框点击清空")
}

function searchCancel() {
  toast.info("搜索框点击取消")
}

function searchChange(value: string) {
  toast.info(`搜索框内容改变为：${value}`)
}
// #endregion
</script>

<template>
  <wd-tabs v-model="tab" swipeable animated custom-class="fit-height" @change="tabChange">
    <wd-tab :title="tabs[0]" :name="tabs[0]" custom-class="tab-content">
      <view class="content">
        <!-- 搜索 -->
        <wd-search
          v-model="searchValue" hide-cancel maxlength="10"
          @focus="searchFocus" @blur="searchBlur" @search="searchAction" @clear="searchClear" @cancel="searchCancel" @change="searchChange"
        />

        <wd-cell-group border>
          <wd-cell size="large" title="部门" icon="setting" />
          <wd-cell size="large" title="角色" icon="user" />
        </wd-cell-group>

        <!-- 成员列表 -->
        <view class="all-member">
          <view style="font-size: 14px;padding: 5px 15px;">
            全部成员
          </view>
          <wd-cell-group border>
            <wd-cell size="large">
              <template #title>
                <view class="title">
                  <image class="avatar" :src="authStore.getAvatar()" />
                  <view style="display: inline-block">
                    {{ authStore.getUserName() }}
                  </view>
                </view>
              </template>
              <wd-tag type="primary" round>
                企业创建者
              </wd-tag>
            </wd-cell>
          </wd-cell-group>
        </view>

        <!-- 邀请入口 -->
        <view>
          <wd-status-tip image="content" tip="邀请更多成员" />
        </view>
      </view>
    </wd-tab>
    <wd-tab :title="tabs[1]" :name="tabs[1]" custom-class="tab-content">
      <view class="content">
        内容{{ tabs[1] }}
      </view>
    </wd-tab>
  </wd-tabs>
</template>

<style lang="scss" scoped>
:deep(.wd-tabs) {
  background: unset !important;

  .wd-tabs__nav {
    border-bottom: 0.5px solid #ebedf0 !important;
    box-sizing: border-box;
  }

  &.fit-height {
    flex-grow: 1;
    overflow: hidden; // 防止子元素使本容器撑开 超出理想的父级高度
  }

  .tab-content {
    background-color: transparent;
    overflow: auto;
  }

  .wd-cell__wrapper {
    align-items: center;
  }

  .wd-tabs__container {
    height: calc(100% - 42px);
  }
}

.all-member {
  margin-top: 20px;

  .title {
    display: flex;
    align-items: center;
  }
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 10px;
  }
}
</style>
