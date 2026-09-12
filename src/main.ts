import * as Pinia from 'pinia'
import { createSSRApp } from 'vue'
import App from './App.vue'
import { setupPages } from './plugins/pages'
import { setupPinia } from './stores'
import 'uno.css'

export function createApp() {
  const app = createSSRApp(App)
  setupPinia(app)
  setupPages(app)
  return {
    app,
    Pinia,
  }
}
