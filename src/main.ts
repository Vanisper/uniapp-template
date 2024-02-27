import { createSSRApp } from "vue"
import "core-js/actual/array/iterator"
import "core-js/actual/promise"
import "core-js/actual/object/assign"
import "core-js/actual/promise/finally"
import "uno.css"

import App from "./App.vue"
import router from "./router"
import { persistPlugin } from "./stores/persist"

const pinia = createPinia()
pinia.use(persistPlugin)

export function createApp() {
  const app = createSSRApp(App)
  app.config.warnHandler = () => null
  app.use(router)
  app.use(pinia)
  return {
    app,
    pinia,
  }
}
