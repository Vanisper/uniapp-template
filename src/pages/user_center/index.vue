<script lang="ts" setup>
import { useToast } from "wot-design-uni"

import userCenterHeader from "./components/user-center-header/index.vue"
import orderGroup from "./components/order-group/index.vue"

const { show: showToast } = useToast()
const router = useRouter()

const menuData = [
  [
    {
      title: "收货地址",
      tit: "",
      url: "",
      type: "address",
    },
    {
      title: "优惠券",
      tit: "",
      url: "",
      type: "coupon",
    },
    {
      title: "积分",
      tit: "",
      url: "",
      type: "point",
    },
  ],
  [
    {
      title: "帮助中心",
      tit: "",
      url: "",
      type: "help-center",
    },
    {
      title: "客服热线",
      tit: "",
      url: "",
      type: "service",
      icon: "service",
    },
  ],
]

const orderTagInfos = [
  {
    title: "待付款",
    iconName: "wallet",
    orderNum: 0,
    tabType: 5,
    status: 1,
  },
  {
    title: "待发货",
    iconName: "clear",
    orderNum: 0,
    tabType: 10,
    status: 1,
  },
  {
    title: "待收货",
    iconName: "a-precisemonitor",
    orderNum: 0,
    tabType: 40,
    status: 1,
  },
  {
    title: "待评价",
    iconName: "tips",
    orderNum: 0,
    tabType: 60,
    status: 1,
  },
  {
    title: "退款/售后",
    iconName: "money-circle",
    orderNum: 0,
    tabType: 0,
    status: 1,
  },
]

const state = reactive({
  showMakePhone: false,
  userInfo: {
    avatarUrl: "",
    nickName: "正在登录...",
    phoneNumber: "",
  },
  menuData,
  orderTagInfos,
  customerServiceInfo: {},
  currAuthStep: 1,
  showKefu: true,
  versionNo: "",
})

function onClickCell(type: string) {
  showToast({
    msg: `你点击了${type}`,
  })

  router.push({ name: "about" })
}
</script>

<template>
  <user-center-header :user-info="state.userInfo" is-phone-hide :curr-auth-step="state.currAuthStep" />
  <view class="relative p-x-4 mt-42">
    <view class="mb-2">
      <order-group :order-tag-infos="state.orderTagInfos" />
    </view>
    <view v-for="(item, index) in menuData" :key="index" class="rounded-2 overflow-hidden mb-3">
      <wd-cell-group :border="false">
        <wd-cell v-for="(xitem, xindex) in item" :key="xindex" :title="xitem.title" :value="xitem.tit" is-link @click="onClickCell(xitem.title)">
          <template v-if="xitem.icon">
            <wd-icon :name="xitem.icon" />
          </template>
        </wd-cell>
      </wd-cell-group>
    </view>
  </view>
</template>
