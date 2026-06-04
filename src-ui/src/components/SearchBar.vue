<template>
  <div class="search-bar">
    <button
      v-if="showBack"
      class="icon-btn back-btn"
      :class="{ visible: showBack }"
      title="Back to search"
      @click="emit('back')"
    >
      ←
    </button>
    <input
      ref="inputRef"
      v-model="query"
      type="text"
      placeholder="Type to search..."
      autocomplete="off"
      spellcheck="false"
      @input="onInput"
    />
    <button class="icon-btn" title="Settings" @click="emit('settings')">⚙</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  showBack?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  back: []
  settings: []
  search: [query: string]
}>()

const query = ref('')
const inputRef = ref<HTMLInputElement>()

let debounceTimer: ReturnType<typeof setTimeout>

function onInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('search', query.value)
  }, 80)
}

function focus() {
  inputRef.value?.focus()
}

function clear() {
  query.value = ''
}

defineExpose({ focus, clear })
</script>