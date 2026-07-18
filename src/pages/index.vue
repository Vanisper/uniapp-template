<!-- eslint-disable no-console -->
<script setup lang="ts">
import Demo from '@/pages-lib/components/Demo.vue'

defineOptions({
  componentPlaceholder: {
    Demo: 'view',
  },
})

definePage({
  tabBar: {
    text: '首页',
    index: -1,
  },
  style: {
    navigationBarTitleText: '首页',
    navigationStyle: 'custom',
  },
})

const receiver = useExposeReceiver<ComponentExposed<typeof Demo>>()

onShow(async () => {
  const demo = await useRefReady(() => receiver.ref.value)
  console.log('[parent] 子组件返回:', demo.test('from parent'))
})

// #region 异步子组件模版 ref 循环示例
const items = ref([{ id: 'a' }, { id: 'b' }])
// 每个实例一个容器，用业务 id 索引
const receivers = new Map<string, ExposeReceiver<ComponentExposed<typeof Demo>>>()
function receiverOf(id: string) {
  let r = receivers.get(id)
  if (!r) {
    r = useExposeReceiver<ComponentExposed<typeof Demo>>()
    receivers.set(id, r)
  }
  return r
}
// #endregion

async function callItem(receiver: ComponentExposed<typeof Demo> | null | undefined, msg = '') {
  const inst = await useRefReady(() => receiver)
  uni.showToast({ title: inst.test(msg) })
}

function goDemo() {
  uni.navigateTo({
    url: '/pages-demo/index',
  })
}
</script>

<template>
  <view bg-blue-gray>异步子组件模版 ref 示例（可点击）</view>
  <view @click="callItem(receiver.ref.value, '你好')">
    <Demo :expose="receiver" />
  </view>

  <view bg-blue-gray>异步子组件模版 ref 循环示例（可点击）</view>
  <view v-for="item in items" :key="item.id" @click="callItem(receiverOf(item.id).ref.value, item.id)">
    <Demo :expose="receiverOf(item.id)" />
  </view>

  <view h-60vh bg-amber>
    11
  </view>
  <button @click="goDemo">
    goDemo
  </button>
  <view h-60vh bg-blue>
    22
  </view>
  <text>33</text>
</template>
