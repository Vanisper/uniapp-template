import type { App } from 'vue'
import { createPersistedState } from 'pinia-plugin-persistedstate'

const store = createPinia()
store.use(
  createPersistedState({
    // https://github.com/Allen-1998/pinia-plugin-persist-uni/issues/21
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    },
  }),
)

export function setupPinia(app: App) {
  app.use(store)
  return store
}

export default store
