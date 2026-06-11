<template>
  <SettingsView v-if="currentView === 'settings'" />
  <MainView v-else />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { useTheme } from './composables/useTheme'
import MainView from './views/MainView.vue'
import SettingsView from './views/SettingsView.vue'
import type { AppConfig, ThemeDTO } from './types'

const currentView = ref<'main' | 'settings'>(
  window.location.hash.includes('/settings') ? 'settings' : 'main',
)
console.log('hash:', window.location.hash)

const theme = useTheme()
let unlistenTheme: UnlistenFn | null = null

onMounted(async () => {
  try {
    const config = await invoke<AppConfig>('get_config')
    if (config.theme && config.theme !== 'dark') {
      const themeData = await invoke<ThemeDTO>('get_theme', { themeId: config.theme })
      if (themeData) {
        theme.loadTheme(themeData)
      }
    }
  } catch (e) {
    console.error('Failed to load theme:', e)
  }

  unlistenTheme = await listen<{ themeId: string }>('theme-changed', async (event) => {
    try {
      const t = await invoke<ThemeDTO>('get_theme', { themeId: event.payload.themeId })
      if (t) theme.loadTheme(t)
    } catch (e) {
      console.error('Failed to reload theme:', e)
    }
  })
})

onUnmounted(() => {
  if (unlistenTheme) unlistenTheme()
})
</script>
