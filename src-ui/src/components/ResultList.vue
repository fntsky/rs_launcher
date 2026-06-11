<template>
  <div class="results-area">
    <div class="divider"></div>
    <div class="results-list">
      <ResultItem
        v-for="(result, index) in results"
        :key="`${result.plugin_id}-${index}`"
        :result="result"
        :selected="index === selectedIndex"
        @click="emit('select', index)"
        @dblclick="emit('execute', index)"
        @contextmenu="(e: MouseEvent) => emit('contextmenu', index, e)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ResultItem from './ResultItem.vue'
import type { SearchResult } from '../types'

interface Props {
  results: SearchResult[]
  selectedIndex: number
}

defineProps<Props>()
const emit = defineEmits<{
  select: [index: number]
  execute: [index: number]
  contextmenu: [index: number, e: MouseEvent]
}>()
</script>