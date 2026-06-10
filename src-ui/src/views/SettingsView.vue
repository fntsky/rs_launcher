<template>
  <div class="settings-window">
    <div class="settings-body">
      <div class="setting-group">
        <label>快捷键</label>
        <div
          class="hotkey-recorder"
          :class="{ recording: isRecording }"
          @click="toggleRecording"
        >
          <span>{{ hotkeyDisplay }}</span>
        </div>
        <p class="setting-hint">点击修改。按下修饰键 + 按键组合。</p>
      </div>
    </div>
    <div class="saved-toast" v-if="showSaved">已保存</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'

const isRecording = ref(false)
const hotkeyDisplay = ref('Ctrl+Alt+Space')
const showSaved = ref(false)
const currentHotkey = ref('Ctrl+Alt+Space')
const props = defineProps<{ embedded?: boolean }>()
const emit = defineEmits<{ close: [] }>()

let savedTimer: ReturnType<typeof setTimeout>

onMounted(async () => {
  try {
    const config = await invoke<{ hotkey_display: string }>('get_config')
    hotkeyDisplay.value = config.hotkey_display
    currentHotkey.value = config.hotkey_display
  } catch (e) {
    console.error('Failed to load config:', e)
  }
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  clearTimeout(savedTimer)
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keydown', handleKeyRecord)
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeWindow()
  }
}

async function closeWindow() {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('keydown', handleKeyRecord)
  if (props.embedded) {
    emit('close')
    return
  }
  try {
    await getCurrentWindow().close()
  } catch {
    // ignore
  }
}

function toggleRecording() {
  isRecording.value = !isRecording.value
  if (isRecording.value) {
    hotkeyDisplay.value = '按下按键组合...'
    window.addEventListener('keydown', handleKeyRecord)
  } else {
    hotkeyDisplay.value = currentHotkey.value
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

  hotkeyDisplay.value = shortcutStr
  isRecording.value = false
  window.removeEventListener('keydown', handleKeyRecord)

  // Save
  currentHotkey.value = shortcutStr
  invoke('save_hotkey', { shortcutStr }).catch(console.error)

  showSaved.value = true
  clearTimeout(savedTimer)
  savedTimer = setTimeout(() => { showSaved.value = false }, 1500)
}
</script>

<style scoped>
.settings-window {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.settings-body {
  flex: 1;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-group label {
  font-size: 13px;
  color: #b0b0b8;
}

.hotkey-recorder {
  height: 36px;
  border-radius: 6px;
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--divider);
  display: flex;
  align-items: center;
  padding: 0 12px;
  cursor: pointer;
  transition: border-color var(--transition-fast), background var(--transition-fast);
  font-size: 14px;
  color: var(--text-primary);
}

.hotkey-recorder:hover {
  border-color: var(--accent);
}

.hotkey-recorder.recording {
  background: var(--bg-selected);
  border-color: var(--accent);
  color: var(--accent);
}

.setting-hint {
  font-size: 11px;
  color: var(--text-hint);
}

.saved-toast {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: #fff;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  animation: toastFadeIn 0.2s ease;
}

@keyframes toastFadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>

<style>
#app {
  border-radius: 0;
}
</style>
