import { ref, shallowRef, type Component } from 'vue'
import { useTauri } from './useTauri'

export function usePlugin() {
  const { invoke } = useTauri()
  const pluginComponent = shallowRef<Component | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadPlugin(pluginId: string): Promise<Component | null> {
    console.log('Loading plugin with ID:', pluginId)
    loading.value = true
    error.value = null
    try {
      // Try new Vue component API first
      const vueComponent = await invoke<{ js: string }>('get_plugin_vue_component', { pluginId }).catch(() => null)
      console.log('Renderer response:', vueComponent)

      if (vueComponent && vueComponent.js) {
        // Create a blob URL from the JS content
        const blob = new Blob([vueComponent.js], { type: 'application/javascript' })
        const url = URL.createObjectURL(blob)

        try {
          const module = await import(/* @vite-ignore */ url)
          const component = module.default || module
          pluginComponent.value = component
          return component
        } finally {
          URL.revokeObjectURL(url)
        }
      }

      // Fallback to old renderer API
      const renderer = await invoke<{ js: string }>('get_plugin_renderer', { pluginId })
      if (!renderer || !renderer.js) {
        error.value = `Plugin ${pluginId} has no renderer`
        return null
      }

      error.value = `Plugin ${pluginId} uses legacy renderer (not supported in Vue mode)`
      return null
    } catch (e) {
      error.value = `Failed to load plugin ${pluginId}: ${e}`
      console.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  function unloadPlugin() {
    pluginComponent.value = null
    error.value = null
  }

  return {
    pluginComponent,
    loading,
    error,
    loadPlugin,
    unloadPlugin,
  }
}
