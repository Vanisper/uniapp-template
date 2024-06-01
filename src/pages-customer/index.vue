<script lang="ts" setup>
import { useMessage, useNotify } from "wot-design-uni"
import { deleteCustomerById, getCustomerList } from "@/services/api"
import type { ICustomer } from "@/model/CustomerModel"

const route = useRoute()
const router = useRouter()

const { showNotify } = useNotify()
const message = useMessage()

const searchValue = ref<string>("")

// #region 路由跳转
function navigateTo(name: string, params?: Record<string, string>) {
  router.push({ name, params })
}
// #endregion

const tabs = ref(["全部客户", "按标签"])
const tab = ref(tabs.value[0])

const notifySafeStore = useNotifySafeStore()
notifySafeStore.weixinFix(route.name || "")

function tabChange(e: string) {
  // showNotify({
  //   safeHeight: notifySafeStore.safeHeight,
  //   message: tab.value,
  // })
}

interface ICustomerList {
  current: number
  pages: number
  records: ICustomer[]
  size: number
  total: number
}
const customerList = ref<ICustomerList>()
onShow(() => {
  getCustomerList().then((res) => {
    customerList.value = res
  })
})

function handleChangePage({ value }: { value: number }) {
  getCustomerList({ pageNo: value }).then((res) => {
    customerList.value = res
  })
}

function handleDelete(id: string) {
  message.confirm({
    title: "提示",
    msg: "确定删除该客户吗？",
  }).then((res0) => {
    if (res0.action === "confirm") {
      deleteCustomerById(id).then((res1) => {
        showNotify({
          safeHeight: notifySafeStore.safeHeight,
          message: `${res1}`,
          type: "success",
        })

        getCustomerList().then((res) => {
          customerList.value = res
        })
      })
    }
  }).catch((err) => {
    if (err.action === "cancel") {
      showNotify({
        safeHeight: notifySafeStore.safeHeight,
        message: "已取消删除",
        type: "primary",
      })
    }
  })
}

function handleEdit(id?: string) {
  if (!id)
    return showNotify({ safeHeight: notifySafeStore.safeHeight, message: "未找到订单信息" })

  navigateTo("customer-add", { id })
}
</script>

<template>
  <view class="search-wrapper">
    <!-- 输入客户名称/联系人/电话查询 -->
    <wd-search v-model="searchValue" cancel-txt="搜索" custom-style="width: 100%;box-sizing: border-box;border-bottom: 1px solid #F2F2F2;" />
    <wd-notice-bar text="左滑可以编辑、删除客户。" prefix="warn-bold" custom-class="custom-notice" />
  </view>

  <wd-tabs v-model="tab" swipeable animated custom-class="fit-height" @change="tabChange">
    <wd-tab :title="tabs[0]" :name="tabs[0]" custom-class="tab-content">
      <view class="content">
        <view v-if="customerList && customerList.records && customerList.records.length" class="list">
          <view class="list-content">
            <wd-swipe-action v-for="(item) in customerList.records" :key="item.id" custom-class="list-content_item">
              <view @click="handleEdit(item.id)">
                <view class="list-content_item__name" style="font-weight: 600;gap: 8px;display: flex;">
                  <text>
                    {{ item.name }}
                  </text>
                  <text>
                    {{ item.recvPhone }}
                  </text>
                </view>
                <view class="list-content_item__addres">
                  <view v-if="item.address" class="flex items-center gap-1">
                    <wd-icon name="home1" size="12px" />
                    <text>{{ item.address }}</text>
                  </view>
                  <view v-if="item.remark" class="flex items-center gap-1">
                    <wd-icon color="red" name="warning" size="12px" />
                    <text>{{ item.remark }}</text>
                  </view>
                </view>
              </view>
              <template #right>
                <view class="swipe-right-action">
                  <view class="button" @click="handleEdit(item.id)">
                    编辑
                  </view>
                  <view class="button error" @click="handleDelete(item.id)">
                    删除
                  </view>
                </view>
              </template>
            </wd-swipe-action>
          </view>

          <view class="list-footer">
            <wd-pagination
              v-model="customerList.current" :total="customerList.total" :page-size="customerList.size" show-icon show-message
              :hide-if-one-page="false" @change="handleChangePage"
            />
          </view>
        </view>
        <wd-status-tip v-else image="content" tip="暂无内容" custom-style="padding-top: 100px;" />
      </view>
    </wd-tab>
    <wd-tab :title="tabs[1]" :name="tabs[1]" custom-class="tab-content">
      <view class="content">
        <wd-status-tip image="network" tip="暂未开放" custom-style="padding-top: 100px;" />
      </view>
    </wd-tab>
  </wd-tabs>

  <!-- 添加客户 -->
  <wd-gap bg-color="#fff" height="120rpx" custom-style="flex-shrink: 0;" />
  <view style="box-shadow: 0px 0px 1px #9f9b9b;" class="fixed z-10 left-0 bottom-0 right-0 h120 bg-white flex justify-between items-center gap-3 px-3">
    <wd-button type="primary" icon="add1" custom-style="width: calc(100% - 20px);" @click="navigateTo('customer-add')">
      添加客户
    </wd-button>
  </view>
</template>

<style lang="scss" scoped>
.search-wrapper {
  background-color: #fff;

  :deep(.custom-notice) {
    --wot-notice-bar-border-radius: 0px;
  }
}

:deep(.fit-height) {
  flex-grow: 1;
  overflow: hidden; // 防止子元素使本容器撑开 超出理想的父级高度

  .tab-content {
    background-color: transparent;
    overflow: auto;
  }

  .wd-tabs__container {
    height: calc(100% - 42px);

    .wd-tab__body {
      height: 100%;
    }
  }
}

.content {
  height: 100%;
  .list {
    position: relative;
    height: 100%;

    .list-content {
      height: calc(100% - 82px);
      overflow: auto;

      :deep(.list-content_item) {
        padding-left: 20px;
        border-bottom: 1px solid #f2f2f2;

        .list-content_item__name {
          font-size: 16px;
          color: #333;
          padding-top: 6px;
        }

        .list-content_item__addres {
          font-size: 12px;
          color: #666;
          margin-top: 6px;
          padding-bottom: 6px;

          display: flex;
          flex-direction: column;
          gap: 3px;
        }
      }
    }

    .list-footer {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 82px;
    }
  }
}

:deep(.wd-swipe-action__right) {

  .swipe-right-action {
    display: flex;
    height: 100%;

    .button {
      height: 100%;
      padding: 0 15px;
      box-sizing:content-box;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #333;
      color: white;
      flex-grow: 1;

      &.error {
        background-color: red;
        color: white;
      }
    }
  }
}
</style>
