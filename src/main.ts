import * as Pinia from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { createSSRApp } from 'vue'
import App from './App.vue'
import 'uno.css'

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

export function createApp() {
  const app = createSSRApp(App)
  app.use(store)
  return {
    app,
    Pinia,
  }
}
