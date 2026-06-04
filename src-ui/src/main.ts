import { createApp } from 'vue'
import App from './App.vue'

// Expose Vue for plugins loaded via Blob URL
import * as Vue from 'vue'
;(window as any).Vue = Vue

console.log('[Vue] Starting app...')
const app = createApp(App)
console.log('[Vue] App created')
app.mount('#app')
console.log('[Vue] App mounted')
