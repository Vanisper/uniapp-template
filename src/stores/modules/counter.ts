export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  function increment() {
    count.value++
  }
  function decrement() {
    count.value--
  }
  return { count, increment, decrement }
  // 持久化
}, { persist: true })
