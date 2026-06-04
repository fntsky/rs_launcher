<template>
  <div class="modal" @click.self="emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Settings</h2>
        <button class="icon-btn" @click="emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div class="setting-group">
          <label>Hotkey</label>
          <div
            class="hotkey-recorder"
            :class="{ recording: isRecording }"
            @click="toggleRecording"
          >
            <span>{{ displayHotkey }}</span>
          </div>
          <p class="setting-hint">Click to change. Press modifier + key combo.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  hotkey: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  'save-hotkey': [hotkey: string]
}>()

const isRecording = ref(false)
const displayHotkey = ref(props.hotkey)

function toggleRecording() {
  isRecording.value = !isRecording.value
  if (isRecording.value) {
    displayHotkey.value = 'Press a key combination...'
    window.addEventListener('keydown', handleKeyRecord)
  } else {
    displayHotkey.value = props.hotkey
    window.removeEventListener('keydown', handleKeyRecord)
  }
}

function handleKeyRecord(e: KeyboardEvent) {
  e.preventDefault()
  e.stopPropagation()

  if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return

  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  if (e.metaKey) parts.push('Super')

  if (parts.length === 0) return

  let keyName = e.key
  if (keyName === ' ') keyName = 'Space'
  else if (keyName.length === 1) keyName = keyName.toUpperCase()

  parts.push(keyName)
  const shortcutStr = parts.join('+')

  displayHotkey.value = shortcutStr
  isRecording.value = false
  window.removeEventListener('keydown', handleKeyRecord)
  emit('save-hotkey', shortcutStr)
}
</script>