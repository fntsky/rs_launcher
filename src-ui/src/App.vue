<template>
  <SettingsView v-if="currentView === 'settings'" />
  <MainView v-else />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useTheme } from './composables/useTheme'
import MainView from './views/MainView.vue'
import SettingsView from './views/SettingsView.vue'

const currentView = ref<'main' | 'settings'>(
  window.location.hash.includes('/settings') ? 'settings' : 'main',
)

try {
  currentView.value = getCurrentWindow().label === 'settings' ? 'settings' : 'main'
} catch {
  // Keep the hash fallback for browser/dev preview.
}

useTheme()
</script>
