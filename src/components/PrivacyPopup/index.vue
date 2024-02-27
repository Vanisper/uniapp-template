<script lang="ts">
export default {
  name: "PrivacyPopup",
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: "shared",
  },
}
</script>

<script lang="ts" setup>
interface Props {
  title?: string // 标题
  desc?: string // 描述
  subDesc?: string // 字描述
  protocol?: string // 协议名称
}

const props = withDefaults(defineProps<Props>(), {
  title: "用户隐私保护提示",
  desc: "感谢您使用本应用，您使用本应用的服务之前请仔细阅读并同意",
  subDesc: "。当您点击同意并开始时用产品服务时，即表示你已理解并同息该条款内容，该条款将对您产生法律约束力。如您拒绝，将无法使用相应服务。",
  protocol: "《用户隐私保护指引》",
})

const emit = defineEmits(["agree", "disagree"])
const showPopup = ref<boolean>(false) // 是否展示popup

const privacyResolves = ref(new Set()) // onNeedPrivacyAuthorization的reslove

const privacyContractName = ref("") // 隐私协议名称

function privacyHandler(resolve: WechatMiniprogram.GeneralCallbackResult) {
  showPopup.value = true
  privacyResolves.value.add(resolve)
}

onBeforeMount(() => {
  // 注册监听
  if (wx.onNeedPrivacyAuthorization) {
    wx.onNeedPrivacyAuthorization((resolve) => {
      if (typeof privacyHandler === "function")

        privacyHandler(resolve)
    })
  }
})

onMounted(() => {
  if (wx.getPrivacySetting) {
    wx.getPrivacySetting({
      success: (res) => {
        // console.log("getPrivacySetting success", res)

        if (res.privacyContractName)
          privacyContractName.value = res.privacyContractName
      },
      fail: () => {},
      complete: () => {},
    })
  }
})

/**
 * 同意隐私协议
 */
function handleAgree() {
  showPopup.value = false
  privacyResolves.value.forEach((resolve: any) => {
    resolve({
      event: "agree",
      buttonId: "agree-btn",
    })
  })
  privacyResolves.value.clear()
  emit("agree")
}

/**
 * 拒绝隐私协议
 */
function handleDisagree() {
  uni.showToast({
    title: "需要同意后，才能继续使用小程序",
    icon: "none",
  })

  showPopup.value = false
  privacyResolves.value.forEach((resolve: any) => {
    resolve({
      event: "disagree",
    })
  })
  privacyResolves.value.clear()
}

/**
 * 打开隐私协议
 */
function openPrivacyContract() {
  wx.openPrivacyContract({
    success: (res) => {
      // eslint-disable-next-line no-console
      console.log("openPrivacyContract success")
    },
    fail: (res) => {
      console.error("openPrivacyContract fail", res)
    },
  })
}

/**
 * 弹出框关闭时清空
 */
function handleClose() {
  privacyResolves.value.clear()
}
</script>

<template>
  <view>
    <wd-popup v-model="showPopup" :close-on-click-modal="false" custom-class="wd-privacy-popup" @close="handleClose">
      <view class="wd-privacy-popup__header">
        <!-- 标题 -->
        <view class="wd-picker__title">
          {{ title }}
        </view>
      </view>
      <view class="wd-privacy-popup__container">
        <text>{{ desc }}</text>
        <text class="wd-privacy-popup__container-protocol" @click="openPrivacyContract">
          {{ privacyContractName || protocol }}
        </text>
        <text>{{ subDesc }}</text>
      </view>
      <view class="wd-privacy-popup__footer">
        <button id="disagree-btn" class="is-block is-round is-medium is-plain wd-privacy-popup__footer-disagree wd-button" @click="handleDisagree">
          拒绝
        </button>
        <button
          id="agree-btn"
          class="is-primary is-block is-round is-medium wd-privacy-popup__footer-agree wd-button"
          open-type="agreePrivacyAuthorization"
          @agreeprivacyauthorization="handleAgree"
        >
          同意
        </button>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
@import './index.scss';
</style>
