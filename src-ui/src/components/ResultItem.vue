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

function handleContextMenu(e: MouseEvent) {
  emit('contextmenu', e)
}

const isAssetUrl = computed(() => {
  const path = props.result.icon_path
  return path && (path.startsWith('rs-asset://') || path.startsWith('http://rs-asset.localhost'))
})

const isImageIcon = computed(() => isAssetUrl.value)

const isEmojiIcon = computed(() => {
  const path = props.result.icon_path
  if (!path || isAssetUrl.value) return false
  return path.length <= 2 || (path.match(/^[\x00-\x7F]+$/) && path.length < 10)
})

const icon = computed(() => {
  if (isEmojiIcon.value) return props.result.icon_path
  return '📄'
})

const iconSrc = computed(() => {
  if (isAssetUrl.value) return props.result.icon_path
  return ''
})
</script>
