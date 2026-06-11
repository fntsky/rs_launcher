<template>
  <div
    class="result-item"
    :class="{ selected }"
    @click="emit('click')"
    @dblclick="emit('dblclick')"
    @contextmenu.prevent="handleContextMenu"
  >
    <img
      v-if="isImageIcon"
      class="result-icon"
      :src="iconSrc"
      alt=""
    />
    <span v-else-if="isEmojiIcon" class="result-icon-emoji">{{ icon }}</span>
    <div v-else class="result-icon-placeholder">📄</div>
    <div class="result-text">
      <div class="result-title">{{ result.title }}</div>
      <div class="result-subtitle" :title="result.subtitle">{{ result.subtitle }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTauri } from '../composables/useTauri'
import type { SearchResult } from '../types'

interface Props {
  result: SearchResult
  selected: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: []
  dblclick: []
  contextmenu: [e: MouseEvent]
}>()

const { convertFileSrc } = useTauri()

function handleContextMenu(e: MouseEvent) {
  emit('contextmenu', e)
}

const icon = computed(() => props.result.icon_path || '📄')

// Check if icon_path is a base64 data URL
const isDataUrl = computed(() => {
  const path = props.result.icon_path
  return path && path.startsWith('data:')
})

// Check if icon_path is an actual image file path (not emoji, not data URL)
const isImageIcon = computed(() => {
  const path = props.result.icon_path
  if (!path) return false
  if (isDataUrl.value) return true
  // If it's a short string (likely emoji) or single ASCII char, not an image
  if (path.length <= 2) return false
  // If it contains only ASCII and is short, likely not a file path
  if (path.match(/^[\x00-\x7F]+$/) && path.length < 10) return false
  return true
})

const isEmojiIcon = computed(() => {
  const path = props.result.icon_path
  if (!path) return false
  if (isDataUrl.value) return false
  // Short strings are treated as emoji/icons
  return path.length <= 2 || (path.match(/^[\x00-\x7F]+$/) && path.length < 10)
})

const iconSrc = computed(() => {
  const path = props.result.icon_path
  if (!path) return ''
  if (isDataUrl.value) {
    return path
  }
  try {
    return convertFileSrc(path)
  } catch {
    return ''
  }
})
</script>
