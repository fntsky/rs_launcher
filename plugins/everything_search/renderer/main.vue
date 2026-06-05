<template>
  <div class="everything-search">
    <div class="ev-main">
      <div ref="resultsEl" class="ev-results">
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
      <div v-else-if="previewVisible && previewIsVideo" class="ev-preview ev-preview-video">
        <video class="ev-video" :src="previewVideoUrl" controls autoplay muted />
      </div>
      <div v-else-if="previewVisible && previewIsPptx && previewPptxData" class="ev-preview ev-preview-pptx">
        <div class="ev-pptx-header">
          <span class="ev-pptx-title">{{ previewPptxData.title || '未命名演示文稿' }}</span>
          <span class="ev-pptx-count">{{ previewPptxData.slides.length }} 张幻灯片</span>
        </div>
        <div v-if="previewPptxData.url" class="ev-pptx-render">
          <VueOfficePptx
            :src="previewPptxData.url"
            class="ev-pptx-office"
            @rendered="onPptxRendered"
            @error="onPptxError"
          />
        </div>
        <div v-else class="ev-pptx-slides">
          <div v-for="slide in previewPptxData.slides" :key="slide.index" class="ev-pptx-slide">
            <div class="ev-pptx-slide-num">第 {{ slide.index }} 页</div>
            <div class="ev-pptx-slide-text">{{ slide.text || '(空白页)' }}</div>
          </div>
        </div>
      </div>
      <div v-else-if="previewVisible && previewIsDocx && previewDocxData" class="ev-preview ev-preview-docx">
        <div class="ev-docx-header">
          <span class="ev-docx-title">{{ previewDocxData.title || '未命名文档' }}</span>
          <span class="ev-docx-count">{{ previewDocxData.paragraphs }} 段</span>
        </div>
        <div v-if="previewDocxData.url" class="ev-docx-render">
          <VueOfficeDocx
            :src="previewDocxData.url"
            class="ev-docx-office"
            @error="onDocxError"
          />
        </div>
        <div v-else class="ev-docx-fallback">
          <div class="ev-docx-fallback-msg">文档预览不可用</div>
        </div>
      </div>
      <div v-else-if="previewVisible && previewIsXlsx && previewXlsxData" class="ev-preview ev-preview-xlsx">
        <div class="ev-xlsx-header">
          <span class="ev-xlsx-title">电子表格</span>
          <span class="ev-xlsx-count">{{ previewXlsxData.sheets }} 个工作表</span>
        </div>
        <div v-if="previewXlsxData.url" class="ev-xlsx-render">
          <VueOfficeExcel
            :src="previewXlsxData.url"
            class="ev-xlsx-office"
            @error="onXlsxError"
          />
        </div>
        <div v-else class="ev-xlsx-fallback">
          <div class="ev-xlsx-fallback-msg">表格预览不可用</div>
        </div>
      </div>
      <div v-else-if="previewVisible && previewIsMd" class="ev-preview ev-preview-md">
        <VueMarkdownPreview :source="previewMdContent" />
      </div>
      <div v-else-if="previewVisible && !previewIsImage && !previewIsVideo && !previewIsPptx && !previewIsDocx && !previewIsXlsx && !previewIsMd" class="ev-preview ev-preview-text" v-html="previewContent">
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import hljs from 'highlight.js/lib/common'
import 'highlight.js/styles/github-dark.css'
import VueOfficePptx from '@vue-office/pptx'
import VueOfficeDocx from '@vue-office/docx'
import VueOfficeExcel from '@vue-office/excel'
import VueMarkdownPreview from '@uivjs/vue-markdown-preview'
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

const VIDEO_EXTENSIONS = new Set([
  'mp4', 'm4v', 'webm', 'mov', 'mkv', 'avi', 'ogv',
])

const PPTX_EXTENSIONS = new Set([
  'pptx', 'ppt',
])

const DOCX_EXTENSIONS = new Set([
  'docx', 'doc',
])

const XLSX_EXTENSIONS = new Set([
  'xlsx', 'xls',
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

function isVideoFile(filename: string): boolean {
  return VIDEO_EXTENSIONS.has(getFileExt(filename))
}

function isPptxFile(filename: string): boolean {
  return PPTX_EXTENSIONS.has(getFileExt(filename))
}

function isDocxFile(filename: string): boolean {
  return DOCX_EXTENSIONS.has(getFileExt(filename))
}

function isXlsxFile(filename: string): boolean {
  return XLSX_EXTENSIONS.has(getFileExt(filename))
}

function isMdFile(filename: string): boolean {
  return getFileExt(filename) === 'md'
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
const previewVideoUrl = ref('')
const previewVisible = ref(false)
const previewIsImage = ref(false)
const previewIsVideo = ref(false)
const previewIsPptx = ref(false)
const previewIsDocx = ref(false)
const previewIsXlsx = ref(false)
const previewIsMd = ref(false)
const previewPptxData = ref<{ url: string | null; title: string | null; slides: { index: number; text: string }[] } | null>(null)
const previewDocxData = ref<{ url: string | null; title: string | null; paragraphs: number } | null>(null)
const previewXlsxData = ref<{ url: string | null; sheets: number; sheetNames: string[] } | null>(null)
const previewMdContent = ref('')

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
    }
  } else if (e.key === 'ArrowUp') {
    if (results.value.length > 0) {
      e.preventDefault?.()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
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
    previewIsImage.value = false
    previewIsVideo.value = false
    previewIsPptx.value = false
    previewIsDocx.value = false
    previewIsXlsx.value = false
    previewIsMd.value = false
    return
  }

  if (isImageFile(result.subtitle)) {
    previewIsVideo.value = false
    previewIsPptx.value = false
    previewIsDocx.value = false
    previewIsXlsx.value = false
    previewIsMd.value = false
    try {
      const res = await window.RS.invoke('read_image', { path: result.subtitle })
      const data = typeof res === 'string' ? JSON.parse(res) : res
      if (data.error) {
        status.value = data.error
        previewVisible.value = false
      } else {
        previewImageUrl.value = data.url
        previewIsImage.value = true
        previewVisible.value = true
      }
    } catch (e: any) {
      status.value = '图片加载失败: ' + (e?.message || e)
      previewVisible.value = false
    }
    return
  }

  if (isVideoFile(result.subtitle)) {
    previewIsImage.value = false
    previewIsPptx.value = false
    previewIsDocx.value = false
    previewIsXlsx.value = false
    previewIsMd.value = false
    try {
      const url = await window.RS.convertFileSrc(result.subtitle)
      previewVideoUrl.value = url
      previewIsVideo.value = true
      previewVisible.value = true
    } catch (e: any) {
      status.value = '视频加载失败: ' + (e?.message || e)
      previewVisible.value = false
    }
    return
  }

  if (isPptxFile(result.subtitle)) {
    previewIsImage.value = false
    previewIsVideo.value = false
    previewIsPptx.value = false
    previewIsDocx.value = false
    previewIsXlsx.value = false
    previewIsMd.value = false
    try {
      const url = await window.RS.convertFileSrc(result.subtitle)
      const meta = await window.RS.invoke('read_pptx', { path: result.subtitle })
      const metaData = typeof meta === 'string' ? JSON.parse(meta) : meta
      previewPptxData.value = { url, title: metaData.title || null, slides: metaData.slides || [] }
      previewIsPptx.value = true
      previewVisible.value = true
    } catch (e: any) {
      status.value = 'PPT 加载失败: ' + (e?.message || e)
      previewVisible.value = false
    }
    return
  }

  if (isDocxFile(result.subtitle)) {
    previewIsImage.value = false
    previewIsVideo.value = false
    previewIsPptx.value = false
    previewIsDocx.value = false
    previewIsXlsx.value = false
    previewIsMd.value = false
    try {
      const url = await window.RS.convertFileSrc(result.subtitle)
      const meta = await window.RS.invoke('read_docx', { path: result.subtitle })
      const metaData = typeof meta === 'string' ? JSON.parse(meta) : meta
      previewDocxData.value = { url, title: metaData.title || null, paragraphs: metaData.paragraphs || 0 }
      previewIsDocx.value = true
      previewVisible.value = true
    } catch (e: any) {
      status.value = '文档加载失败: ' + (e?.message || e)
      previewVisible.value = false
    }
    return
  }

  if (isXlsxFile(result.subtitle)) {
    previewIsImage.value = false
    previewIsVideo.value = false
    previewIsPptx.value = false
    previewIsDocx.value = false
    previewIsXlsx.value = false
    previewIsMd.value = false
    try {
      const url = await window.RS.convertFileSrc(result.subtitle)
      const meta = await window.RS.invoke('read_xlsx', { path: result.subtitle })
      const metaData = typeof meta === 'string' ? JSON.parse(meta) : meta
      previewXlsxData.value = { url, sheets: metaData.sheets || 0, sheetNames: (metaData.sheet_names || []).slice() }
      previewIsXlsx.value = true
      previewVisible.value = true
    } catch (e: any) {
      status.value = '表格加载失败: ' + (e?.message || e)
      previewVisible.value = false
    }
    return
  }

  if (isMdFile(result.subtitle)) {
    previewIsImage.value = false
    previewIsVideo.value = false
    previewIsPptx.value = false
    previewIsDocx.value = false
    previewIsXlsx.value = false
    previewIsMd.value = false
    previewVisible.value = false
    try {
      const res = await window.RS.invoke('read_file', { path: result.subtitle })
      const data = typeof res === 'string' ? JSON.parse(res) : res
      if (data.error) {
        previewVisible.value = false
      } else {
        previewMdContent.value = data.content
        previewIsMd.value = true
        previewVisible.value = true
      }
    } catch {
      previewVisible.value = false
    }
    return
  }

  previewIsImage.value = false
  previewIsVideo.value = false
  previewIsPptx.value = false
  previewIsDocx.value = false
  previewIsXlsx.value = false
  previewIsMd.value = false

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

function onPptxRendered() {
  console.log('[pptx] rendered')
}

function onPptxError(e: unknown) {
  console.error('[pptx] render error', e)
  status.value = 'PPT 渲染失败: ' + (e instanceof Error ? e.message : String(e))
}

function onDocxError(e: unknown) {
  console.error('[docx] render error', e)
  status.value = '文档渲染失败: ' + (e instanceof Error ? e.message : String(e))
}

function onXlsxError(e: unknown) {
  console.error('[xlsx] render error', e)
  status.value = '表格渲染失败: ' + (e instanceof Error ? e.message : String(e))
}

const resultsEl = ref<HTMLElement | null>(null)

watch(() => selectedIndex.value, async () => {
  status.value = ''
  await nextTick()
  const el = resultsEl.value?.querySelector('.ev-item.selected') as HTMLElement | null
  el?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  updatePreview()
})

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
  overflow: hidden;
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
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin: 4px 8px;
  border-radius: 6px;
}

.ev-preview-text {
  overflow-y: auto;
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

.ev-preview-video {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  padding: 8px;
  min-height: 200px;
  border-radius: 6px;
}

.ev-video {
  max-width: 100%;
  max-height: 400px;
  width: 100%;
  border-radius: 4px;
  outline: none;
}

.ev-preview-pptx {
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.ev-pptx-header {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--divider, #3a3a42);
  background: var(--bg-primary, #16161a);
}

.ev-pptx-title {
  font-size: 13px;
  font-weight: 600;
  color: #f0f0f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.ev-pptx-count {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--bg-hover, rgba(255, 255, 255, 0.06));
  border-radius: 10px;
}

.ev-pptx-slides {
  padding: 4px 0;
}

.ev-pptx-render {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #f5f5f5;
}

.ev-pptx-office {
  display: block;
  width: 100%;
  height: 100%;
}

.ev-pptx-slide {
  padding: 8px 12px;
  border-bottom: 1px solid var(--divider, rgba(255, 255, 255, 0.04));
}

.ev-pptx-slide:last-child {
  border-bottom: none;
}

.ev-pptx-slide-num {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-hint, #888);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.ev-pptx-slide-text {
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-primary, #e0e0e0);
  white-space: pre-wrap;
  word-break: break-word;
}

.ev-preview-docx {
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.ev-docx-header {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--divider, #3a3a42);
  background: var(--bg-primary, #16161a);
}

.ev-docx-title {
  font-size: 13px;
  font-weight: 600;
  color: #f0f0f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.ev-docx-count {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--bg-hover, rgba(255, 255, 255, 0.06));
  border-radius: 10px;
}

.ev-docx-render {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #fff;
}

.ev-docx-office {
  display: block;
  width: 100%;
}

.ev-docx-fallback {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.ev-docx-fallback-msg {
  color: var(--text-hint, #888);
  font-size: 13px;
}

.ev-preview-xlsx {
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  background: var(--bg-secondary);
  border-radius: 6px;
}

.ev-xlsx-header {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--divider, #3a3a42);
  background: var(--bg-primary, #16161a);
}

.ev-xlsx-title {
  font-size: 13px;
  font-weight: 600;
  color: #f0f0f0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.ev-xlsx-count {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--bg-hover, rgba(255, 255, 255, 0.06));
  border-radius: 10px;
}

.ev-xlsx-render {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  background: #fff;
}

.ev-xlsx-office {
  display: block;
  width: 100%;
}

.ev-xlsx-fallback {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}

.ev-xlsx-fallback-msg {
  color: var(--text-hint, #888);
  font-size: 13px;
}

.ev-preview-md {
  overflow-y: auto;
  padding: 12px 16px;
  background: var(--bg-secondary);
}

.ev-preview-md h1,
.ev-preview-md h2,
.ev-preview-md h3,
.ev-preview-md h4,
.ev-preview-md h5,
.ev-preview-md h6 {
  color: var(--text-primary, #e0e0e0);
  border-color: var(--divider, #3a3a42);
}

.ev-preview-md p,
.ev-preview-md li,
.ev-preview-md blockquote {
  color: var(--text-primary, #e0e0e0);
}

.ev-preview-md code {
  color: #e6e6e6;
  background: var(--bg-hover, #3a3a42);
}

.ev-preview-md pre {
  background: var(--bg-primary, #1e1e22);
  border: 1px solid var(--divider, #3a3a42);
}

.ev-preview-md pre code {
  color: #e6e6e6;
  background: transparent;
}

.ev-preview-md a {
  color: var(--accent, #4a90d9);
}

.ev-preview-md blockquote {
  border-left-color: var(--accent, #4a90d9);
  background: var(--bg-hover, rgba(255, 255, 255, 0.06));
}

.ev-preview-md hr {
  border-color: var(--divider, #3a3a42);
}

.ev-preview-md table {
  color: var(--text-primary, #e0e0e0);
}

.ev-preview-md th,
.ev-preview-md td {
  border-color: var(--divider, #3a3a42);
}

.ev-preview-md img {
  max-width: 100%;
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
.ev-preview::-webkit-scrollbar {
  width: 6px;
}

.ev-results::-webkit-scrollbar-track,
.ev-preview::-webkit-scrollbar-track {
  background: transparent;
}

.ev-results::-webkit-scrollbar-thumb,
.ev-preview::-webkit-scrollbar-thumb {
  background: var(--divider);
  border-radius: 3px;
  transition: background 0.15s;
}

.ev-results::-webkit-scrollbar-thumb:hover,
.ev-preview::-webkit-scrollbar-thumb:hover {
  background: var(--text-hint);
}

.ev-results,
.ev-preview {
  scrollbar-width: thin;
  scrollbar-color: var(--divider) transparent;
}
</style>
