<script lang="ts" setup>
import { useMessage, useNotify } from "wot-design-uni"
import cloneDeep from "lodash/cloneDeep"
import type { ICustomer } from "@/model/CustomerModel"

import { addCustomer, editCustomer, getCustomerById } from "@/services/api"

const notify = useNotify()
const message = useMessage("wd-message-box-slot")
const route = useRoute()

const notifySafeStore = useNotifySafeStore()
notifySafeStore.weixinFix(route.name || "")

const isEdit = ref(false)
const editId = ref("")

const customer = ref<ICustomer>({
  id: "",
  code: "",
  name: "",
  logisticsAddress: "",
  isEnabled: 1,
})
const collapseValue = ref<string[]>([])
const customerCategoryColumns = ref([
  {
    label: "默认",
    value: "0",
    disabled: false,
  },
  {
    label: "公司",
    value: "1",
    disabled: false,
  },
  {
    label: "商贩",
    value: "2",
    disabled: false,
  },
  {
    label: "零售",
    value: "3",
    disabled: false,
  },
])
const customerLevelColumns = ref([
  {
    label: "默认",
    value: "0",
    disabled: false,
  },
  {
    label: "一级",
    value: "1",
    disabled: false,
  },
  {
    label: "二级",
    value: "2",
    disabled: false,
  },
])
const taxScaleColumns = ref([
  {
    label: "默认",
    value: "0",
    disabled: false,
  },
  {
    label: "一般纳税人",
    value: "1",
    disabled: false,
  },
])

const customerRequired = ref([
  "name",
  "isEnabled",
])

function customerDataCheck(value?: ICustomer) {
  if (!value) {
    notify.showNotify({
      message: "请填写完整信息",
      safeHeight: notifySafeStore.safeHeight,
      type: "danger",
    })
    return false
  }

  // 检验customerRequired 为必填项
  for (const key of customerRequired.value) {
    if ((value as any)[key] === undefined || (value as any)[key] === "") {
      notify.showNotify({
        message: "请填写完整信息",
        safeHeight: notifySafeStore.safeHeight,
        type: "danger",
      })
      return false
    }
  }

  return true
}

const displaySetting = reactive({
  base: true, // 基本信息
  invoice: true, // 开票信息
  payment: true, // 办款资料
  recv: true, // 收件信息
  financial: true, // 财务信息
  other: true, // 其他信息

  operation: false, // 操作信息
})
const tempDisplaySetting = reactive(cloneDeep(displaySetting))

function openDisplaySetting() {
  message.confirm({
    title: "显示设置",
  }).then((res) => {
    if (res.action === "confirm") {
      displaySetting.base = tempDisplaySetting.base
      displaySetting.invoice = tempDisplaySetting.invoice
      displaySetting.payment = tempDisplaySetting.payment
      displaySetting.recv = tempDisplaySetting.recv
      displaySetting.financial = tempDisplaySetting.financial
      displaySetting.other = tempDisplaySetting.other
      displaySetting.operation = tempDisplaySetting.operation

      notify.showNotify({
        message: "设置成功",
        safeHeight: notifySafeStore.safeHeight,
        type: "success",
      })
    }
  }).catch((err) => {
    if (err.action === "cancel") {
      tempDisplaySetting.base = displaySetting.base
      tempDisplaySetting.invoice = displaySetting.invoice
      tempDisplaySetting.payment = displaySetting.payment
      tempDisplaySetting.recv = displaySetting.recv
      tempDisplaySetting.financial = displaySetting.financial
      tempDisplaySetting.other = displaySetting.other
      tempDisplaySetting.operation = displaySetting.operation

      notify.showNotify({
        message: "取消设置",
        safeHeight: notifySafeStore.safeHeight,
        type: "primary",
      })
    }
  })
}

function submit() {
  if (!customerDataCheck(customer.value))
    return

  if (isEdit.value) {
    editCustomer(customer.value).then((res) => {
      notify.showNotify({
        message: "编辑成功",
        safeHeight: notifySafeStore.safeHeight,
        type: "success",
      })
    }).catch((err) => {
      notify.showNotify({
        message: `编辑客户失败: ${err?.response?.data?.message || err?.message || err?.toString()}`,
        safeHeight: notifySafeStore.safeHeight,
        type: "danger",
      })
    })
  }
  else {
    addCustomer(customer.value).then((res) => {
      notify.showNotify({
        message: "添加成功",
        safeHeight: notifySafeStore.safeHeight,
        type: "success",
      })

      editId.value = res.id
      isEdit.value = true
      init()
    }).catch((err) => {
      notify.showNotify({
        message: `添加客户失败: ${err?.response?.data?.message || err?.message || err?.toString()}`,
        safeHeight: notifySafeStore.safeHeight,
        type: "danger",
      })
    })
  }
}

function init() {
  if (editId.value || route.params?.id) {
    getCustomerById(editId.value || route.params?.id).then((res) => {
      const result = res!
      customer.value = result

      isEdit.value = true
      editId.value = result.id
    })
  }
  else {
    customer.value = {
      id: "",
      code: "",
      name: "",
      logisticsAddress: "",
      isEnabled: 1,
    }
  }
}

onMounted(() => {
  init()
})
</script>

<template>
  <wd-message-box selector="wd-message-box-slot" use-slot style="--wot-message-box-content-max-height: fit-content;">
    <view class="message-item">
      <!-- <text class="message-item_title">
        基础信息
      </text>
      <view class="message-item_action">
        <wd-switch v-model="tempDisplaySetting.base" size="small" />
      </view> -->
    </view>
    <view class="message-item">
      <text class="message-item_title">
        开票信息
      </text>
      <view class="message-item_action">
        <wd-switch v-model="tempDisplaySetting.invoice" size="small" />
      </view>
    </view>
    <view class="message-item">
      <text class="message-item_title">
        办款资料
      </text>
      <view class="message-item_action">
        <wd-switch v-model="tempDisplaySetting.payment" size="small" />
      </view>
    </view>
    <view class="message-item">
      <text class="message-item_title">
        收件信息
      </text>
      <view class="message-item_action">
        <wd-switch v-model="tempDisplaySetting.recv" size="small" />
      </view>
    </view>
    <view class="message-item">
      <text class="message-item_title">
        财务信息
      </text>
      <view class="message-item_action">
        <wd-switch v-model="tempDisplaySetting.financial" size="small" />
      </view>
    </view>
    <view class="message-item">
      <text class="message-item_title">
        其他信息
      </text>
      <view class="message-item_action">
        <wd-switch v-model="tempDisplaySetting.other" size="small" />
      </view>
    </view>
    <!-- <view class="message-item">
      <text class="message-item_title">
        操作信息
      </text>
      <view class="message-item_action">
        <wd-switch v-model="tempDisplaySetting.operation" size="small" />
      </view>
    </view> -->
  </wd-message-box>

  <view class="wrapper">
    <view class="content">
      <!-- 基本信息 -->
      <view class="content-item">
        <view class="content-item_title">
          基本信息
        </view>
        <view class="content-item_content">
          <view class="content-item_content__item">
            <view class="content-item_content__item">
              <wd-input v-model="customer.name" label="名称" required placeholder="请输入" />
            </view>
            <view class="content-item_content__item">
              <wd-input v-model="customer.recvPhone" label="联系电话" placeholder="请输入" />
            </view>
            <view class="content-item_content__item">
              <wd-input v-model="customer.address" label="客户地址" placeholder="请输入" />
            </view>
            <view class="content-item_content__item">
              <wd-picker
                v-model="customer.customerCategory"
                label="客户分类 | 标签"
                :columns="customerCategoryColumns"
              />
            </view>
            <view class="content-item_content__item">
              <wd-picker
                v-model="customer.customerLevel"
                label="客户等级"
                :columns="customerLevelColumns"
              />
            </view>
            <wd-input v-model="customer.code" label="编码" placeholder="请输入" />
          </view>

          <view class="content-item_content__item">
            <wd-input v-model="customer.logisticsAddress" label="物流地址" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-picker
              v-model="customer.taxScale"
              label="纳税规模"
              :columns="taxScaleColumns"
            />
          </view>
          <view class="content-item_content__item">
            <wd-cell label="启用">
              <wd-switch v-model="customer.isEnabled" :active-value="1" :inactive-value="0" size="small" />
            </wd-cell>
          </view>
          <view class="content-item_content__item">
            <wd-textarea v-model="customer.remark" label="备注" placeholder="客户备注" auto-height />
          </view>
        </view>
      </view>

      <!--
      <view v-if="displaySetting.invoice" class="content-item">
        <view class="content-item_title">
          开票信息
        </view>
        <view class="content-item_content">
          <view class="content-item_content__item">
            <wd-input v-model="customer.invoiceCompany" label="单位名称" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.invoiceTaxCode" label="税务代码" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.invoiceBankName" label="开户行" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.invoiceBankCode" label="行号" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.invoiceAccount" label="账户" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.invoicePhone" label="联系电话" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.invoiceAddress" label="开票地址" placeholder="请输入" />
          </view>
        </view>
      </view>

      <view v-if="displaySetting.payment" class="content-item">
        <view class="content-item_title">
          办款资料
        </view>
        <view class="content-item_content">
          <view class="content-item_content__item">
            <wd-input v-model="customer.paymentCompany" label="单位名称" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.paymentBankName" label="开户行" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.paymentBankCode" label="行号" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.paymentAccount" label="账户" placeholder="请输入" />
          </view>
        </view>
      </view>

      <view v-if="displaySetting.recv" class="content-item">
        <view class="content-item_title">
          收件信息
        </view>
        <view class="content-item_content">
          <view class="content-item_content__item">
            <wd-input v-model="customer.recvName" label="收件人" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.recvPhone" label="联系电话" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.recvAddress" label="收件地址" placeholder="请输入" />
          </view>
        </view>
      </view>

      <view v-if="displaySetting.financial" class="content-item">
        <view class="content-item_title">
          财务信息
        </view>
        <view class="content-item_content">
          <view class="content-item_content__item">
            <wd-input v-model="customer.financialContacts" label="财务联系人" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.financialPhone" label="财务电话" placeholder="请输入" />
          </view>
        </view>
      </view>

      <view v-if="displaySetting.other" class="content-item">
        <view class="content-item_title">
          其他信息
        </view>
        <view class="content-item_content">
          <view class="content-item_content__item">
            <wd-input v-model="customer.shortName" label="简称" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.website" label="客户网站" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.legalPerson" label="法人代表" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.legalPersonPhone" label="法人电话" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.headquarters" label="所属总公司" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.area" label="所属地区" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.bizArea" label="业务区域" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.address" label="客户地址" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.attachment" label="附件" placeholder="请输入" />
          </view>
        </view>
      </view>

      <view v-if="displaySetting.operation" class="content-item">
        <view class="content-item_title">
          操作信息
        </view>
        <view class="content-item_content">
          <view class="content-item_content__item">
            <wd-input v-model="customer.createTime" label="创建时间" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.createBy" label="创建人" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.updateTime" label="修改时间" placeholder="请输入" />
          </view>
          <view class="content-item_content__item">
            <wd-input v-model="customer.updateBy" label="修改人" placeholder="请输入" />
          </view>
        </view>
      </view>
    -->

      <!-- 折叠面板显示模式 -->
      <wd-collapse v-model="collapseValue">
        <wd-collapse-item v-if="displaySetting.invoice" title="开票信息" name="invoice">
          <!-- 开票信息 -->
          <view class="collapse-item">
            <wd-input v-model="customer.invoiceCompany" label="单位名称" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.invoiceTaxCode" label="税务代码" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.invoiceBankName" label="开户行" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.invoiceBankCode" label="行号" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.invoiceAccount" label="账户" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.invoicePhone" label="联系电话" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.invoiceAddress" label="开票地址" placeholder="请输入" />
          </view>
        </wd-collapse-item>
        <wd-collapse-item v-if="displaySetting.payment" title="办款资料" name="payment">
          <!-- 办款资料 -->
          <view class="collapse-item">
            <wd-input v-model="customer.paymentCompany" label="单位名称" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.paymentBankName" label="开户行" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.paymentBankCode" label="行号" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.paymentAccount" label="账户" placeholder="请输入" />
          </view>
        </wd-collapse-item>
        <wd-collapse-item v-if="displaySetting.recv" title="收件信息" name="recv">
          <!-- 收件信息 -->
          <view class="collapse-item">
            <wd-input v-model="customer.recvName" label="收件人" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.recvPhone" label="联系电话" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.recvAddress" label="收件地址" placeholder="请输入" />
          </view>
        </wd-collapse-item>
        <wd-collapse-item v-if="displaySetting.financial" title="财务信息" name="financial">
          <!-- 财务信息 -->
          <view class="collapse-item">
            <wd-input v-model="customer.financialContacts" label="财务联系人" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.financialPhone" label="财务电话" placeholder="请输入" />
          </view>
        </wd-collapse-item>
        <wd-collapse-item v-if="displaySetting.other" title="其他信息" name="other">
          <!-- 其他信息 -->
          <view class="collapse-item">
            <wd-input v-model="customer.shortName" label="简称" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.website" label="客户网站" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.legalPerson" label="法人代表" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.legalPersonPhone" label="法人电话" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.headquarters" label="所属总公司" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.area" label="所属地区" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.bizArea" label="业务区域" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.attachment" label="附件" placeholder="请输入" />
          </view>
        </wd-collapse-item>
        <wd-collapse-item v-if="displaySetting.operation" title="操作信息" name="operation">
          <!-- 操作信息 -->
          <view class="collapse-item">
            <wd-input v-model="customer.createTime" label="创建时间" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.createBy" label="创建人" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.updateTime" label="修改时间" placeholder="请输入" />
          </view>
          <view class="collapse-item">
            <wd-input v-model="customer.updateBy" label="修改人" placeholder="请输入" />
          </view>
        </wd-collapse-item>
      </wd-collapse>

      <!-- 按钮 -->
      <wd-gap bg-color="transparent" height="120rpx" custom-style="flex-shrink: 0;margin-top: 10px;" />
      <view style="box-shadow: 0px 0px 1px #9f9b9b;" class="fixed z-10 left-0 bottom-0 right-0 h120 bg-white flex justify-between items-center gap-3 px-3">
        <wd-button type="icon" icon="setting" round custom-style="background-color: #F7F7F7;" @click="openDisplaySetting" />
        <wd-button type="primary" icon="add1" custom-style="width: calc(100% - 20px);" @click="submit">
          {{ isEdit ? '更新' : '添加' }}客户
        </wd-button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
:deep(.wd-collapse-item) {

  .wd-collapse-item__body {
    padding: 0;

    .collapse-item {
      padding-left: 15px;

      &:not(:last-child) {
        .wd-input {
          border-bottom: 1px dotted #f0f0f0;
        }
      }

      &:first-child {
        .wd-input {
          padding-top: 5px;
        }
      }
    }
  }
}

.message-item {
  display: flex;
  align-items: center;
  margin-top: 15px;
  justify-content: center;

  &_title {
    font-size: 16px;
    white-space: nowrap;
  }

  &_action {
    display: flex;
    justify-content: flex-start;
    padding-left: 20px;
    flex-wrap: wrap;
    gap: 1px;
  }
}

.wrapper {
  flex-grow: 1;
  overflow: hidden;

  .content {
    height: 100%;
    box-sizing: border-box;
    overflow: auto;

    .content-item {
      padding: 15px;
      padding-bottom: 0;
      background-color: #fff;
      margin-bottom: 15px;

      &_title {
        font-size: 12px;
        padding-left: 10px;
        padding-bottom: 5px;
        color: #666;
      }

      &_content {
        display: flex;
        flex-direction: column;
        --wot-cell-label-fs: 14px;
        --wot-cell-label-color: #000000d9;

        &__item {
          &:not(:last-child) {
            border-bottom: 1px solid #f0f0f0;
          }

          :deep(.wd-cell__wrapper) {
            display: flex;
            align-items: center;

            .wd-cell__left {
              width: 33%;
              flex: unset;
            }

            .wd-cell__value {
              display: flex;
              align-items: center;
            }
          }
        }
      }
    }
  }
}
</style>
