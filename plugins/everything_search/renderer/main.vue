<template>
  <div class="everything-search">
    <div class="ev-main">
      <div class="ev-results">
        <div v-if="results.length === 0" class="ev-empty">
          {{ loading ? '搜索中...' : '输入关键词搜索文件和文件夹' }}
        </div>
        <div v-for="(result, index) in results" :key="index" class="ev-item"
          :class="{ selected: index === selectedIndex }" @click="selectedIndex = index; openResult(index)">
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
        <div v-if="results[selectedIndex]?.size">
          <div class="ev-info-label">大小</div>
          <div class="ev-info-value">{{ results[selectedIndex].size }}</div>
        </div>
        <div v-if="results[selectedIndex]">
          <div class="ev-info-label">类型</div>
          <div class="ev-info-value">{{ results[selectedIndex].is_folder ? '文件夹' : '文件' }}</div>
        </div>
      </div>
    </div>
    <div v-if="results[selectedIndex]" class="ev-path-bar">
      {{ results[selectedIndex].subtitle }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github-dark.css'

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'less',
  'py', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'swift',
  'kt', 'scala', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
  'xml', 'yaml', 'yml', 'toml', 'ini', 'conf', 'cfg', 'log',
  'sql', 'graphql', 'vue', 'svelte', 'dart', 'lua', 'r', 'pl', 'pm',
  'dockerfile', 'gitignore', 'env', 'properties'
])

const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'
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
    // Fallback: escape HTML
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

interface Props {
  context: {
    query: string
    invoke: (command: string, args: Record<string, unknown>) => Promise<unknown>
    openFile: (path: string) => Promise<void>
    hideWindow: () => Promise<void>
  }
}

const props = defineProps<Props>()

const query = ref('')
const results = ref<SearchResult[]>([])
const selectedIndex = ref(-1)
const status = ref('')
const previewContent = ref('')
const previewImageUrl = ref('')
const previewVisible = ref(false)
const previewIsImage = ref(false)
const loading = ref(false)
const debug = ref('init')
const searchCount = ref(0)
const mountCount = ref(0)

async function search() {
  if (!query.value.trim()) {
    results.value = []
    selectedIndex.value = -1
    return
  }
  const id = ++searchCount.value
  debug.value = `[#${id}] loading...`
  loading.value = true
  try {
    const result = await props.context.invoke('search', { query: query.value }) as string
    const data = JSON.parse(result)
    debug.value = `[#${id}] done, error=${data.error}, count=${data.results?.length ?? -1}`
    if (data.error) {
      status.value = data.error
      results.value = []
    } else {
      status.value = ''
      results.value = data.results || []
    }
    selectedIndex.value = results.value.length > 0 ? 0 : -1
  } catch (e) {
    status.value = '搜索出错: ' + e
    debug.value = `[#${id}] err: ${e}`
    results.value = []
  } finally {
    loading.value = false
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (results.value.length > 0) {
      selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
      updatePreview()
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (results.value.length > 0) {
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      updatePreview()
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (selectedIndex.value >= 0) {
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
      const res = await props.context.invoke('read_image', { path: result.subtitle }) as string
      const data = JSON.parse(res)
      if (data.error) {
        previewVisible.value = false
      } else {
        previewImageUrl.value = data.url
        previewIsImage.value = true
        previewVisible.value = true
      }
    } catch (e) {
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
    const res = await props.context.invoke('read_file', { path: result.subtitle }) as string
    const data = JSON.parse(res)
    if (data.error) {
      previewVisible.value = false
    } else {
      previewContent.value = highlightCode(data.content, result.subtitle)
      previewIsImage.value = false
      previewVisible.value = true
    }
  } catch (e) {
    previewVisible.value = false
  }
}

async function openResult(index: number) {
  const result = results.value[index]
  if (!result) return
  await props.context.openFile(result.subtitle)
  await props.context.hideWindow()
}

// Expose search method to parent
function onSearch(newQuery: string) {
  query.value = newQuery
  results.value = []
  selectedIndex.value = -1
  search()
}

defineExpose({ onSearch, onKeyDown })

// Sync query from parent context prop
watch(() => props.context.query, (newQuery) => {
  console.log('Context query changed:', newQuery)
  if (newQuery !== query.value) {
    query.value = newQuery
  }
})

// Auto-update preview when selection changes
watch(() => selectedIndex.value, () => {
  updatePreview()
})

// Trigger initial search when plugin activates
onMounted(() => {
  mountCount.value++
  debug.value = `mount#${mountCount.value}:` + (props.context.query || 'empty')
  if (props.context.query) {
    query.value = props.context.query
    search()
  }
})
</script>

<style>
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
  overflow: hidden;
}

.ev-results {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.ev-path-bar {
  grid-area: path;
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 11px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.2);
}

.ev-path-bar.hidden {
  display: none;
}

.ev-sidebar {
  grid-area: sidebar;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 8px 0;
}

.ev-status {
  padding: 12px 16px;
  color: #ff6b6b;
  font-size: 13px;
  background: rgba(255, 107, 107, 0.1);
  border-radius: 6px;
  margin: 4px 8px;
}

.ev-status.hidden {
  display: none;
}

.ev-empty {
  padding: 24px 16px;
  color: #888;
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
}

.ev-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.ev-item.selected {
  background: rgba(255, 255, 255, 0.1);
}

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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Preview panel */
.ev-preview {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin: 4px 8px;
  border-radius: 6px;
}

.ev-preview.hidden {
  display: none;
}

.ev-preview-text {
  padding: 8px 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #ccc;
  background: rgba(0, 0, 0, 0.15);
  white-space: pre-wrap;
  word-break: break-word;
}

.ev-preview-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.15);
  padding: 8px;
}

.ev-image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.ev-image-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}


.ev-preview .hl-function {
  color: #61afef;
}

.ev-preview .hl-type {
  color: #e5c07b;
}

.ev-file-info {
  padding: 12px 16px;
  font-size: 13px;
}

.ev-info-label {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.ev-info-value {
  color: #ccc;
  margin-bottom: 12px;
  word-break: break-word;
}

.ev-info-value:last-child {
  margin-bottom: 0;
}
</style>
