<script setup lang="ts">
import type { FormSchema } from '@wot-ui/ui'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui'

interface Profile {
  nickname: string
  notifications: boolean
}

defineOptions({
  options: {
    addGlobalClass: true,
    virtualHost: true,
    styleIsolation: 'shared',
  },
})

const form = reactive<Profile>({ nickname: '', notifications: true })
const formRef = shallowRef<FormInstance>()
const savedProfile = shallowRef<Profile>()
const saving = shallowRef(false)
const toast = useToast('wot-profile')

const schema: FormSchema = {
  validate(model) {
    const nickname = String(model.nickname ?? '').trim()
    return nickname.length < 2 || nickname.length > 12
      ? [{ path: ['nickname'], message: '请输入 2–12 个字的称呼，不能只有空格' }]
      : []
  },
  isRequired: path => path === 'nickname',
}

const status = computed(() => {
  if (!savedProfile.value)
    return '尚未保存'
  return savedProfile.value.nickname === form.nickname.trim() && savedProfile.value.notifications === form.notifications
    ? '已保存至本页'
    : '有未保存修改'
})

async function saveProfile() {
  if (saving.value || !formRef.value)
    return

  saving.value = true
  try {
    const { valid } = await formRef.value.validate()
    if (!valid)
      return

    form.nickname = form.nickname.trim()
    savedProfile.value = { ...form }
    toast.success('偏好已保存至本页')
  }
  finally {
    saving.value = false
  }
}

function resetProfile() {
  form.nickname = ''
  form.notifications = true
  savedProfile.value = undefined
  formRef.value?.reset()
  toast.close()
}

onScopeDispose(() => toast.close())
</script>

<template>
  <view class="profile-card">
    <view class="section-heading">
      <view>
        <view class="section-number">01 / FORM</view>
        <view class="section-title">我的偏好</view>
      </view>
      <wd-tag :type="status === '已保存至本页' ? 'success' : 'default'" size="small">{{ status }}</wd-tag>
    </view>
    <view class="section-description">先直接保存，查看必填提示；填写称呼后再次保存。</view>

    <wd-form ref="formRef" :model="form" :schema="schema" :disabled="saving" layout="vertical">
      <wd-form-item prop="nickname" title="怎么称呼你" required>
        <wd-input v-model="form.nickname" placeholder="输入 2–12 个字" :maxlength="12" clearable show-word-limit />
      </wd-form-item>
      <wd-form-item prop="notifications" title="接收更新提醒" layout="horizontal" center>
        <view class="switch-field">
          <text class="switch-state">{{ form.notifications ? '已开启' : '已关闭' }}</text>
          <wd-switch v-model="form.notifications" :size="24" />
        </view>
      </wd-form-item>
    </wd-form>

    <view class="form-actions">
      <wd-button :loading="saving" @click="saveProfile">保存偏好</wd-button>
      <wd-button type="info" variant="plain" :disabled="saving" @click="resetProfile">重置</wd-button>
    </view>
    <view v-if="savedProfile" class="saved-result">
      <view class="result-label">最近保存</view>
      <view class="result-value">{{ savedProfile.nickname }} · 更新提醒{{ savedProfile.notifications ? '开启' : '关闭' }}</view>
    </view>
    <wd-toast selector="wot-profile" :z-index="2100" />
  </view>
</template>

<style scoped>
.profile-card { padding: 20px 16px; border: 1px solid #e6eae4; border-radius: 18px; background: #fff; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.section-number { color: #8d988b; font-size: 10px; letter-spacing: 1px; }
.section-title { margin-top: 7px; font-size: 18px; font-weight: 600; }
.section-description { margin: 12px 0 16px; color: #808781; font-size: 12px; line-height: 1.8; }
.switch-field { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.switch-state { color: #808781; font-size: 12px; }
.form-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.saved-result { margin-top: 18px; padding: 12px 14px; border-radius: 10px; background: #f1f6f0; }
.result-label { color: #7d8b7b; font-size: 10px; }
.result-value { margin-top: 6px; color: #3e6152; font-size: 13px; line-height: 1.7; overflow-wrap: anywhere; }
</style>
