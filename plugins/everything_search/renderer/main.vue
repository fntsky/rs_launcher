<template>
  <div class="everything-search">
    <div class="ev-main">
      <div class="ev-results">
        <div v-if="results.length === 0" class="ev-empty">
          {{ loading ? '搜索中...' : '输入关键词搜索文件和文件夹' }}
        </div>
        <div v-for="(result, index) in results" :key="index" class="ev-item"
          :class="{ selected: index === selectedIndex }" @click="onItemClick(index)">
          <img v-if="result.icon" class="ev-icon-img" :src="result.icon" />
          <span v-else class="ev-icon">{{ result.is_folder ? '📁' : '📄' }}</span>
          <div class="ev-info">
            <div class="ev-title">{{ result.title }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="ev-sidebar">
      <div v-if="status" class="ev-status">{{ status }}</div>
      <div v-if="previewVisible && previewIsImage" class="ev-preview ev-preview-image">
        <div class="ev-image-wrap">
          <img class="ev-image-img" :src="previewImageUrl" alt="preview" />
        </div>
      </div>
      <div v-else-if="previewVisible && !previewIsImage" class="ev-preview ev-preview-text" v-html="previewContent">
      </div>
      <div class="ev-file-info">
        <div v-if="currentResult?.size">
          <div class="ev-info-label">大小</div>
          <div class="ev-info-value">{{ currentResult.size }}</div>
        </div>
        <div v-if="currentResult">
          <div class="ev-info-label">类型</div>
          <div class="ev-info-value">{{ currentResult.is_folder ? '文件夹' : '文件' }}</div>
        </div>
      </div>
    </div>
    <div v-if="currentResult" class="ev-path-bar">
      {{ currentResult.subtitle }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github-dark.css'
import type { RSKeyEvent } from './rs-sdk'

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'less',
  'py', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'swift',
  'kt', 'scala', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'xml', 'yaml', 'yml', 'toml', 'ini', 'conf', 'cfg', 'log',
  'sql', 'graphql', 'vue', 'svelte', 'dart', 'lua', 'r', 'pl', 'pm',
  'dockerfile', 'gitignore', 'env', 'properties',
])

const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif',
])

function getFileExt(filename: string): string {
  const idx = filename.lastIndexOf('.')
  return idx > 0 ? filename.slice(idx + 1).toLowerCase() : ''
}

function isTextFile(filename: string): boolean {
  return TEXT_EXTENSIONS.has(getFileExt(filename))
}

function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.has(getFileExt(filename))
}

function getHljsLanguage(filename: string): string | undefined {
  const extMap: Record<string, string> = {
    js: 'javascript', ts: 'typescript', jsx: 'javascript', tsx: 'typescript',
    vue: 'html', svelte: 'html', html: 'xml', svg: 'xml',
    py: 'python', rs: 'rust', go: 'go', java: 'java',
    c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp',
    php: 'php', rb: 'ruby', swift: 'swift', kt: 'kotlin',
    scala: 'scala', dart: 'dart', lua: 'lua', r: 'r', pl: 'perl', pm: 'perl',
    sh: 'bash', bash: 'bash', zsh: 'bash', fish: 'bash',
    ps1: 'powershell', bat: 'dos',
    sql: 'sql', graphql: 'graphql',
    json: 'json', yml: 'yaml', yaml: 'yaml', toml: 'ini',
    xml: 'xml', md: 'markdown',
    css: 'css', scss: 'scss', less: 'less',
    dockerfile: 'dockerfile', ini: 'ini',
  }
  return extMap[getFileExt(filename)]
}

function highlightCode(code: string, filename: string): string {
  const lang = getHljsLanguage(filename)
  try {
    const result = lang ? hljs.highlight(code, { language: lang }) : hljs.highlightAuto(code)
    return result.value
  } catch {
    return code
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

interface SearchResult {
  title: string
  subtitle: string
  icon: string
  is_folder: boolean
  size?: string
}

const query = ref('')
const results = ref<SearchResult[]>([])
const selectedIndex = ref(-1)
const status = ref('')
const previewContent = ref('')
const previewImageUrl = ref('')
const previewVisible = ref(false)
const previewIsImage = ref(false)
const loading = ref(false)
let searchCount = 0

const currentResult = computed(() => results.value[selectedIndex.value] || null)

async function runSearch() {
  if (!query.value.trim()) {
    results.value = []
    selectedIndex.value = -1
    return
  }
  const id = ++searchCount
  loading.value = true
  try {
    const result = await window.RS.invoke('search', { query: query.value })
    const data = typeof result === 'string' ? JSON.parse(result) : result
    if (id !== searchCount) return
    if (data.error) {
      status.value = data.error
      results.value = []
    } else {
      status.value = ''
      results.value = data.results || []
    }
    selectedIndex.value = results.value.length > 0 ? 0 : -1
  } catch (e: any) {
    if (id !== searchCount) return
    status.value = '搜索出错: ' + (e?.message || e)
    results.value = []
  } finally {
    if (id === searchCount) loading.value = false
  }
}

function handleKeyDown(e: any) {
  if (e.key === 'ArrowDown') {
    if (results.value.length > 0) {
      e.preventDefault?.()
      selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
      updatePreview()
    }
  } else if (e.key === 'ArrowUp') {
    if (results.value.length > 0) {
      e.preventDefault?.()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      updatePreview()
    }
  } else if (e.key === 'Enter') {
    if (selectedIndex.value >= 0) {
      e.preventDefault?.()
      openResult(selectedIndex.value)
    }
  }
}

async function updatePreview() {
  const result = results.value[selectedIndex.value]
  if (!result) {
    previewVisible.value = false
    return
  }

  if (isImageFile(result.subtitle)) {
    try {
      const res = await window.RS.invoke('read_image', { path: result.subtitle })
      const data = typeof res === 'string' ? JSON.parse(res) : res
      if (data.error) {
        previewVisible.value = false
      } else {
        previewImageUrl.value = data.url
        previewIsImage.value = true
        previewVisible.value = true
      }
    } catch {
      previewVisible.value = false
    }
    return
  }

  previewIsImage.value = false

  if (!isTextFile(result.subtitle)) {
    previewVisible.value = false
    return
  }

  try {
    const res = await window.RS.invoke('read_file', { path: result.subtitle })
    const data = typeof res === 'string' ? JSON.parse(res) : res
    if (data.error) {
      previewVisible.value = false
    } else {
      previewContent.value = highlightCode(data.content, result.subtitle)
      previewIsImage.value = false
      previewVisible.value = true
    }
  } catch {
    previewVisible.value = false
  }
}

async function openResult(index: number) {
  const result = results.value[index]
  if (!result) return
  await window.RS.openFile(result.subtitle)
  await window.RS.hideWindow()
}

function onItemClick(index: number) {
  selectedIndex.value = index
  updatePreview()
}

watch(() => selectedIndex.value, () => updatePreview())

let unsubQuery: (() => void) | null = null
let unsubKey: (() => void) | null = null
let unsubCtx: (() => void) | null = null

onMounted(async () => {
  await window.RS.ready

  unsubQuery = window.RS.on('query-change', (q: string) => {
    if (q === query.value) return
    query.value = q
    results.value = []
    selectedIndex.value = -1
    runSearch()
  })

  unsubKey = window.RS.on('keydown', (k: RSKeyEvent) => handleKeyDown(k))

  unsubCtx = window.RS.on('context-change', () => {
    const initialQuery = window.RS.context?.query
    if (initialQuery && initialQuery !== query.value) {
      query.value = initialQuery
      runSearch()
    }
  })

  const initialQuery = window.RS.context?.query
  if (initialQuery) {
    query.value = initialQuery
    runSearch()
  }
})

onUnmounted(() => {
  unsubQuery?.()
  unsubKey?.()
  unsubCtx?.()
})
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

.everything-search {
  display: grid;
  grid-template-columns: 2fr 3fr;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    "main sidebar"
    "path path";
  height: 100%;
  overflow: hidden;
}

.ev-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.ev-results {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 0;
}

.ev-path-bar {
  grid-area: path;
  padding: 8px 12px;
  border-top: 1px solid var(--divider, #3a3a42);
  font-size: 11px;
  color: var(--text-primary, #e0e0e0) !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--bg-secondary, #1e1e22) !important;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  letter-spacing: 0.2px;
}

.ev-sidebar {
  grid-area: sidebar;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 0;
}

.ev-status {
  flex-shrink: 0;
  padding: 12px 16px;
  color: #ff6b6b;
  font-size: 13px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 6px;
  margin: 4px 8px;
}

.ev-empty {
  padding: 24px 16px;
  color: var(--text-hint);
  font-size: 13px;
  text-align: center;
}

.ev-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
  color: var(--text-primary, #e0e0e0);
}

.ev-item:hover { background: var(--bg-hover); }
.ev-item.selected { background: var(--bg-selected); }

.ev-icon {
  font-size: 16px;
  width: 22px;
  text-align: center;
  flex-shrink: 0;
}

.ev-icon-img {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.ev-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.ev-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary, #e0e0e0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ev-preview {
  flex-shrink: 0;
  min-height: 0;
  overflow: visible;
  margin: 4px 8px;
  border-radius: 6px;
}

.ev-preview-text {
  padding: 8px 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-primary);
  background: var(--bg-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

.ev-preview-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  padding: 8px;
  min-height: 200px;
}

.ev-image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.ev-image-img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.ev-file-info {
  flex-shrink: 0;
  padding: 12px 16px;
  font-size: 13px;
}

.ev-info-label {
  font-size: 11px;
  color: var(--text-hint);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.ev-info-value {
  color: var(--text-primary);
  margin-bottom: 12px;
  word-break: break-word;
}

.ev-info-value:last-child { margin-bottom: 0; }

.ev-results::-webkit-scrollbar,
.ev-sidebar::-webkit-scrollbar {
  width: 6px;
}

.ev-results::-webkit-scrollbar-track,
.ev-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.ev-results::-webkit-scrollbar-thumb,
.ev-sidebar::-webkit-scrollbar-thumb {
  background: var(--divider);
  border-radius: 3px;
  transition: background 0.15s;
}

.ev-results::-webkit-scrollbar-thumb:hover,
.ev-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--text-hint);
}

.ev-results,
.ev-sidebar {
  scrollbar-width: thin;
  scrollbar-color: var(--divider) transparent;
}
</style>
