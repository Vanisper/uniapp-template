<script lang="ts" setup>
const props = defineProps({
  orderTagInfos: {
    type: Array<any>,
    default: () => [],
  },
  title: {
    type: String,
    default: "我的订单",
  },
  desc: {
    type: String,
    default: "全部订单",
  },
  isTop: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(["onClickTop", "onClickItem"])

function onClickItem(e: any) {
  emit("onClickItem", (e.currentTarget as HTMLElement)?.dataset.item)
}

function onClickTop() {
  emit("onClickTop", {})
}
</script>

<template>
  <view class="mb-3 rounded-t-2 bg-white overflow-hidden">
    <wd-cell-group v-if="isTop" :border="false">
      <wd-cell :title="title" :value="desc" is-link @click="onClickTop" />
    </wd-cell-group>
    <view class="overflow-hidden w-full h-164 flex bg-white">
      <view
        v-for="(item, index) in orderTagInfos"
        :key="index"
        class="order-group__item overflow-hidden flex flex-auto flex-items-center flex-justify-center flex-col"
        @click="onClickItem"
      >
        <view class="mb-2 w-56 h-56 relative">
          <wd-badge :model-value="item.orderNum" :max="99" color="#FF4646">
            <wd-icon
              :name="item.iconName"
              size="56rpx"
              custom-style="background-image: -webkit-linear-gradient(90deg, #6a6a6a 0%,#929292 100%);-webkit-background-clip: text;-webkit-text-fill-color: transparent;"
            />
          </wd-badge>
        </view>
        <view class="text-24 line-height-4 text-gray-600">
          {{ item.title }}
        </view>
      </view>
    </view>
  </view>
</template>
