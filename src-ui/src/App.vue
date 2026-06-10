<template>
  <SettingsView v-if="currentView === 'settings'" />
  <MainView v-else />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from './composables/useTheme'
import MainView from './views/MainView.vue'
import SettingsView from './views/SettingsView.vue'

const currentView = ref<'main' | 'settings'>(
  window.location.hash.includes('/settings') ? 'settings' : 'main',
)
console.log('hash:', window.location.hash)
useTheme()
</script>
