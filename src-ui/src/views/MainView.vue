<template>
  <div id="app">
    <SearchBar ref="searchBarRef" :show-back="!!activePlugin" @back="deactivatePlugin" @settings="openSettings"
      @search="onSearch" />
    <ResultList v-if="!activePlugin && results.length > 0" :results="results" :selected-index="selectedIndex"
      @select="selectResult" @execute="executeResult" />
    <PluginRenderer v-if="activePlugin" ref="pluginRendererRef" :plugin-id="activePlugin" :query="query" />
    <HintBar v-if="!activePlugin && results.length === 0 && !query" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import SearchBar from '../components/SearchBar.vue'
import ResultList from '../components/ResultList.vue'
import PluginRenderer from '../components/PluginRenderer.vue'
import HintBar from '../components/HintBar.vue'
import { useTauri } from '../composables/useTauri'
import { useSearch } from '../composables/useSearch'
import { useWindow } from '../composables/useWindow'
import type { SearchResult } from '../types'

const { invoke } = useTauri()
const { search } = useSearch()
const { setWindowSize, setPluginWindowSize, setPluginSize, hideWindow } = useWindow()

const query = ref('')
const results = ref<SearchResult[]>([])
const selectedIndex = ref(-1)
const activePlugin = ref<string | null>(null)
const searchBarRef = ref<InstanceType<typeof SearchBar>>()
const pluginRendererRef = ref<InstanceType<typeof PluginRenderer>>()

async function onSearch(q: string) {
  query.value = q
  if (activePlugin.value) {
    pluginRendererRef.value?.doSearch(q)
    return
  }
  results.value = await search(q)
  selectedIndex.value = results.value.length > 0 ? 0 : -1
  setWindowSize(results.value.length > 0)
}

function selectResult(index: number) {
  selectedIndex.value = index
}

async function executeResult(index: number) {
  const result = results.value[index]
  if (!result) return
  if (result.action === 'open_renderer') {
    activePlugin.value = result.plugin_id
    setPluginWindowSize()
    return
  }
  await invoke('execute_result', { subtitle: result.subtitle })
}

function deactivatePlugin() {
  activePlugin.value = null
  query.value = ''
  results.value = []
  selectedIndex.value = -1
  setWindowSize(false)
  searchBarRef.value?.clear()
  searchBarRef.value?.focus()
}

function openSettings() {
  invoke('open_settings_window').catch(console.error)
}

const PLUGIN_FORWARD_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Enter', 'Tab',
  'PageUp', 'PageDown', 'Home', 'End',
  'Insert',
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
  'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
])

function isPluginKey(e: KeyboardEvent): boolean {
  if (PLUGIN_FORWARD_KEYS.has(e.key)) return true
  if (e.ctrlKey || e.metaKey || e.altKey) return true
  return false
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (activePlugin.value) {
      deactivatePlugin()
      return
    }
    if (query.value) {
      query.value = ''
      onSearch('')
      return
    }
    hideWindow()
    return
  }

  if (activePlugin.value && pluginRendererRef.value) {
    if (isPluginKey(e)) {
      e.preventDefault()
      pluginRendererRef.value.onKeyDown(e)
    }
    return
  }

  if (e.key === 'Enter' && results.value.length > 0 && selectedIndex.value >= 0) {
    e.preventDefault()
    executeResult(selectedIndex.value)
    return
  }

  if (e.key === 'ArrowDown' && results.value.length > 0) {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
    return
  }

  if (e.key === 'ArrowUp' && results.value.length > 0) {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
    return
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('rs-plugin-back', onPluginBack as EventListener)
  window.addEventListener('rs-plugin-resize', onPluginResize as EventListener)

  results.value = await search('')
  selectedIndex.value = results.value.length > 0 ? 0 : -1
  if (results.value.length > 0) {
    setWindowSize(true)
  }
})

function onPluginBack(e: CustomEvent) {
  if (e.detail?.pluginId === activePlugin.value) {
    deactivatePlugin()
  }
}

function onPluginResize(e: CustomEvent) {
  const d = e.detail
  if (!d) return
  setPluginSize(d.width, d.height)
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('rs-plugin-back', onPluginBack as EventListener)
  window.removeEventListener('rs-plugin-resize', onPluginResize as EventListener)
})
</script>
