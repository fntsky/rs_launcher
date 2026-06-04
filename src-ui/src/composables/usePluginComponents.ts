import { defineAsyncComponent, type Component } from 'vue'

// Discover all plugin components at build time (Vue SFC has priority)
const vueModules = import.meta.glob('../plugins/*/renderer/main.vue')
const tsModules = import.meta.glob('../plugins/*/renderer/main.ts')

export const pluginComponentMap: Record<string, Component> = {}

for (const [path, loader] of Object.entries(vueModules)) {
  const match = path.match(/plugins\/([^/]+)\/renderer\/main\.vue$/)
  if (match) {
    pluginComponentMap[match[1]] = defineAsyncComponent(() => loader() as any)
  }
}

// Fallback to .ts entry for plugins without .vue
for (const [path, loader] of Object.entries(tsModules)) {
  const match = path.match(/plugins\/([^/]+)\/renderer\/main\.ts$/)
  if (match && !pluginComponentMap[match[1]]) {
    pluginComponentMap[match[1]] = defineAsyncComponent(() => loader() as any)
  }
}
