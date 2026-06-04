import { defineComponent, ref, watch } from 'vue'

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

function highlightCode(text: string): string {
  const lines = text.split('\n')
  return lines.map(line => {
    let html = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Highlight strings
    html = html.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="hl-string">$1</span>')
    html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="hl-string">$1</span>')

    // Highlight comments
    html = html.replace(/(\/\/.*$)/gm, '<span class="hl-comment">$1</span>')
    html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="hl-comment">$1</span>')

    // Highlight numbers
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="hl-number">$1</span>')

    return html
  }).join('\n')
}

interface SearchResult {
  title: string
  subtitle: string
  icon: string
  is_folder: boolean
  size?: string
}

export default defineComponent({
  name: 'EverythingSearchPlugin',
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const query = ref('')
    const results = ref<SearchResult[]>([])
    const selectedIndex = ref(-1)
    const status = ref('')
    const previewContent = ref('')
    const previewImageUrl = ref('')
    const previewVisible = ref(false)
    const previewIsImage = ref(false)
    const loading = ref(false)

    let debounceTimer: ReturnType<typeof setTimeout>

    async function search() {
      if (!query.value.trim()) {
        results.value = []
        selectedIndex.value = -1
        return
      }

      loading.value = true
      try {
        const result = await props.context.invoke('search', { query: query.value })
        const data = JSON.parse(result)
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
          const res = await props.context.invoke('read_image', { path: result.subtitle })
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
        const res = await props.context.invoke('read_file', { path: result.subtitle })
        const data = JSON.parse(res)
        if (data.error) {
          previewVisible.value = false
        } else {
          previewContent.value = highlightCode(data.content)
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

    watch(() => props.context.query, (newQuery) => {
      query.value = newQuery
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(search, 80)
    })

    // Auto-update preview when selection changes
    watch(selectedIndex, () => {
      updatePreview()
    })

    return {
      query,
      results,
      selectedIndex,
      status,
      previewContent,
      previewImageUrl,
      previewVisible,
      previewIsImage,
      loading,
      search,
      onKeyDown,
      openResult
    }
  },
  template: `
    <div class="everything-search">
      <div class="ev-main">
        <div class="ev-results">
          <div v-if="results.length === 0" class="ev-empty">
            {{ loading ? '搜索中...' : '输入关键词搜索文件和文件夹' }}
          </div>
          <div
            v-for="(result, index) in results"
            :key="index"
            class="ev-item"
            :class="{ selected: index === selectedIndex }"
            @click="selectedIndex = index; openResult(index)"
          >
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
        <div v-else-if="previewVisible && !previewIsImage" class="ev-preview ev-preview-text" v-html="previewContent"></div>
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
  `
})