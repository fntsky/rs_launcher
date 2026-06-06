import { createApp } from 'vue'
import App from './App.vue'

import * as Vue from 'vue'
;(window as any).Vue = Vue

const app = createApp(App)
app.mount('#app')
