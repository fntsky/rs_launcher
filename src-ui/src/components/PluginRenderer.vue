<template>
  <div class="plugin-renderer">
    <component
      :is="pluginComponentMap[pluginId]"
      v-if="pluginComponentMap[pluginId]"
      ref="pluginRef"
      :context="pluginContext"
    />
    <div v-else class="plugin-loading">Plugin not found: {{ pluginId }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTauri } from '../composables/useTauri'
import { pluginComponentMap } from '../composables/usePluginComponents'
import type { PluginContext } from '../types'

interface Props {
  pluginId: string
  query: string
}

const props = defineProps<Props>()
const { invoke, getCurrentWindow } = useTauri()
const pluginRef = ref<any>(null)

const pluginContext = computed<PluginContext>(() => ({
  query: props.query,
  invoke: async (command: string, args: Record<string, unknown>) => {
    return invoke('plugin_invoke', {
      pluginId: props.pluginId,
      command,
      args: JSON.stringify(args),
    })
  },
  openFile: async (path: string) => {
    await invoke('execute_result', { subtitle: path })
  },
  hideWindow: async () => {
    const appWindow = getCurrentWindow()
    await appWindow.hide()
  },
  theme: {
    mode: 'dark',
    vars: {
      '--bg-primary': '#1e1e22',
      '--bg-secondary': '#2a2a30',
      '--text-primary': '#e0e0e0',
      '--accent': '#4a90d9',
    },
  },
  config: {
    hotkey: 'Ctrl+Alt+Space',
  },
}))

function doSearch(query: string) {
  if (pluginRef.value?.onSearch) {
    pluginRef.value.onSearch(query)
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (pluginRef.value?.onKeyDown) {
    pluginRef.value.onKeyDown(e)
  }
}

defineExpose({ doSearch, onKeyDown })
</script>
