import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'vue': resolve(__dirname, 'vue-shim.ts')
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'main.vue'),
      name: 'EverythingSearchPlugin',
      fileName: 'index',
      formats: ['es']
    },
    outDir: 'dist',
    emptyOutDir: true
  }
})