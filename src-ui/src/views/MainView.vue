<template>
  <div id="app">
    <SearchBar ref="searchBarRef" :show-back="!!activePlugin" @back="deactivatePlugin" @settings="openSettings"
      @search="onSearch" />
    <ResultList v-if="!activePlugin && results.length > 0" :results="results" :selected-index="selectedIndex"
      @select="selectResult" @execute="executeResult" @contextmenu="showContextMenu" />
    <PluginRenderer v-if="activePlugin" ref="pluginRendererRef" :plugin-id="activePlugin" :query="query" />
    <HintBar v-if="!activePlugin && results.length === 0 && !query" />
    <div v-if="contextMenu" class="context-menu" :style="contextMenuStyle">
      <div v-if="contextMenu.result.plugin_id !== 'everything_search'" class="context-menu-item" @click="contextOpen">打开</div>
      <div class="context-menu-item" @click="contextOpenFileLocation">打开文件所在位置</div>
      <div class="context-menu-item" @click="contextCopyPath">复制路径</div>
      <div class="context-menu-item" @click="contextCopyName">复制文件名</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import SearchBar from '../components/SearchBar.vue'
import ResultList from '../components/ResultList.vue'
import PluginRenderer from '../components/PluginRenderer.vue'
import HintBar from '../components/HintBar.vue'
import { useTauri } from '../composables/useTauri'
import { useSearch } from '../composables/useSearch'
import { useWindow } from '../composables/useWindow'
import type { SearchResult } from '../types'

const { invoke, getCurrentWindow } = useTauri()
const { search } = useSearch()
const { setWindowSize, setPluginWindowSize, setPluginSize, hideWindow } = useWindow()

const query = ref('')
const results = ref<SearchResult[]>([])
const selectedIndex = ref(-1)
const activePlugin = ref<string | null>(null)
const searchBarRef = ref<InstanceType<typeof SearchBar>>()
const pluginRendererRef = ref<InstanceType<typeof PluginRenderer>>()

interface ContextMenu {
  x: number
  y: number
  result: SearchResult
}
const contextMenu = ref<ContextMenu | null>(null)
const contextMenuStyle = computed(() => {
  if (!contextMenu.value) return {}
  const pad = 8
  const w = 180
  const h = 108
  let x = contextMenu.value.x
  let y = contextMenu.value.y
  if (x + w > window.innerWidth - pad) x = window.innerWidth - w - pad
  if (y + h > window.innerHeight - pad) y = window.innerHeight - h - pad
  return { left: `${Math.max(pad, x)}px`, top: `${Math.max(pad, y)}px` }
})

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

function showContextMenu(index: number, e: MouseEvent) {
  const result = results.value[index]
  if (!result) return
  contextMenu.value = { x: e.clientX, y: e.clientY, result }
}

function closeContextMenu() {
  contextMenu.value = null
}

function onDocumentClick(e: MouseEvent) {
  const el = e.target as HTMLElement
  if (!el.closest('.context-menu')) {
    closeContextMenu()
  }
}

watch(contextMenu, (val) => {
  if (val) {
    setTimeout(() => document.addEventListener('click', onDocumentClick), 0)
  } else {
    document.removeEventListener('click', onDocumentClick)
  }
})

let autoHideReady = false
let focusGainTimer: ReturnType<typeof setTimeout>
let unlistenFocus: (() => void) | null = null

function contextOpen() {
  const r = contextMenu.value?.result
  if (!r) return
  invoke('execute_result', { subtitle: r.subtitle }).catch(console.error)
  closeContextMenu()
}

function contextOpenFileLocation() {
  const r = contextMenu.value?.result
  if (!r) return
  if (r.plugin_id === 'everything_search') {
    invoke('plugin_invoke', {
      pluginId: r.plugin_id,
      command: 'show_in_folder',
      args: JSON.stringify({ path: r.subtitle }),
    }).catch(console.error)
  } else {
    invoke('open_file_location', { path: r.subtitle }).catch(console.error)
  }
  closeContextMenu()
}

function contextCopyPath() {
  const path = contextMenu.value?.result.subtitle
  if (path) navigator.clipboard.writeText(path).catch(console.error)
  closeContextMenu()
}

function contextCopyName() {
  const path = contextMenu.value?.result.subtitle
  if (path) {
    const name = path.split('\\').pop() || path.split('/').pop() || path
    navigator.clipboard.writeText(name).catch(console.error)
  }
  closeContextMenu()
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
    if (contextMenu.value) {
      closeContextMenu()
      return
    }
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

  const appWindow = getCurrentWindow()
  unlistenFocus = await appWindow.onFocusChanged(({ payload: focused }) => {
    if (focused) {
      clearTimeout(focusGainTimer)
      focusGainTimer = setTimeout(() => { autoHideReady = true }, 200)
    } else if (autoHideReady && !query.value && !activePlugin.value) {
      hideWindow()
      autoHideReady = false
    }
  })

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
  document.removeEventListener('click', onDocumentClick)
  if (unlistenFocus) unlistenFocus()
  clearTimeout(focusGainTimer)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 200;
  min-width: 170px;
  background: var(--bg-primary);
  border: 1px solid var(--divider);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 4px;
}

.context-menu-item {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-primary);
  border-radius: 4px;
  cursor: pointer;
  transition: background var(--transition-fast);
  white-space: nowrap;
}

.context-menu-item:hover {
  background: var(--bg-hover);
}
</style>
