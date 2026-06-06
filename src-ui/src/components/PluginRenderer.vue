<template>
  <div class="plugin-renderer">
    <iframe
      v-if="pluginId && !error"
      ref="iframeRef"
      class="plugin-iframe"
      sandbox="allow-scripts allow-forms"
      referrerpolicy="no-referrer"
      :title="`Plugin ${pluginId}`"
    />
    <div v-else-if="error" class="plugin-error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePluginIframe } from '../composables/usePluginIframe'

interface Props {
  pluginId: string
  query: string
}

const props = defineProps<Props>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const pluginIdRef = ref<string | null>(props.pluginId)

const { ready, error, load, doSearch, onKeyDown } = usePluginIframe({
  iframeRef,
  pluginId: pluginIdRef,
})

watch(() => props.pluginId, (id) => {
  pluginIdRef.value = id
  if (id) {
    load(id, props.query)
  }
}, { immediate: true })

watch(() => props.query, (q) => {
  if (ready.value) doSearch(q)
})

defineExpose({ doSearch, onKeyDown })
</script>

<style scoped>
.plugin-renderer {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.plugin-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  background: transparent;
}

.plugin-error {
  padding: 16px;
  color: #ff6b6b;
  font-size: 13px;
  text-align: center;
}
</style>
