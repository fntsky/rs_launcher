import { ref, shallowRef, watch, onBeforeUnmount, type Ref, type ShallowRef } from 'vue'
import { useTauri } from './useTauri'
import { useTheme } from './useTheme'
import type { RSTheme } from './useTheme'

export interface IframeInit {
  plugin_id: string
  sdk_js: string
  base_dir: string
  renderer_path: string
  html_content: string
  query: string
  config: Record<string, unknown>
  version: string
}

export interface UsePluginIframeOptions {
  iframeRef: Ref<HTMLIFrameElement | null>
  pluginId: Ref<string | null>
}

export function usePluginIframe(options: UsePluginIframeOptions) {
  const { iframeRef, pluginId } = options
  const { invoke, convertFileSrc, getCurrentWindow } = useTauri()
  const theme = useTheme()

  const ready = ref(false)
  const error = ref<string | null>(null)
  const loading = ref(false)
  const currentInit: ShallowRef<IframeInit | null> = shallowRef(null)

  let handshakeTimer: ReturnType<typeof setTimeout> | null = null
  let unsubTheme: (() => void) | null = null

  function injectSdk(html: string, sdkJs: string): string {
    const scriptTag = `<script>${sdkJs}<\/script>`
    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head[^>]*>/i, (m) => `${m}\n${scriptTag}`)
    }
    if (/<html[^>]*>/i.test(html)) {
      return html.replace(/<html[^>]*>/i, (m) => `${m}\n<head>${scriptTag}</head>`)
    }
    return `<!doctype html><html><head>${scriptTag}</head><body>${html}</body></html>`
  }

  function buildSrcdoc(init: IframeInit): string {
    return injectSdk(init.html_content, init.sdk_js)
  }

  function onMessage(ev: MessageEvent) {
    const data = ev.data
    if (!data || typeof data !== 'object' || !data.type) return
    if (data.protocol !== 'iframe-renderer/1') return

    const iframe = iframeRef.value
    if (!iframe || ev.source !== iframe.contentWindow) return

    const init = currentInit.value
    if (!init) return

    if (data.type === 'rs:handshake') {
      if (handshakeTimer) { clearTimeout(handshakeTimer); handshakeTimer = null }
      const t = theme.current.value
      iframe.contentWindow?.postMessage({
        type: 'rs:init',
        protocol: 'iframe-renderer/1',
        version: init.version,
        context: {
          pluginId: init.plugin_id,
          query: init.query,
          config: init.config,
          theme: { mode: t.mode, vars: { ...t.vars } },
        },
      }, '*')
    } else if (data.type === 'rs:ready') {
      ready.value = true
    } else if (data.type === 'rs:read-binary') {
      const path: string = data.path
      if (!path) return
      const sendBack = (payload: Record<string, unknown>) => {
        iframe.contentWindow?.postMessage({ type: 'rs:read-binary:res', protocol: 'iframe-renderer/1', id: data.id, ...payload }, '*')
      }
      try {
        const assetUrl = convertFileSrc(path)
        fetch(assetUrl)
          .then((resp) => {
            if (!resp.ok) throw new Error('fetch failed: ' + resp.status)
            return resp.arrayBuffer()
          })
          .then((buf) => {
            sendBack({ ok: true, value: buf })
          })
          .catch((e) => {
            sendBack({ ok: false, error: String(e?.message || e) })
          })
      } catch (e) {
        sendBack({ ok: false, error: String(e) })
      }
    } else if (data.type === 'rs:invoke:req') {
      invoke<string>('plugin_invoke', {
        pluginId: init.plugin_id,
        command: data.command,
        args: JSON.stringify(data.args || {}),
      }).then((value) => {
        iframe.contentWindow?.postMessage({
          type: 'rs:invoke:res',
          protocol: 'iframe-renderer/1',
          id: data.id,
          ok: true,
          value,
        }, '*')
      }).catch((e) => {
        iframe.contentWindow?.postMessage({
          type: 'rs:invoke:res',
          protocol: 'iframe-renderer/1',
          id: data.id,
          ok: false,
          error: String(e?.message || e),
        }, '*')
      })
    } else if (data.type === 'rs:open-file') {
      invoke('execute_result', { subtitle: data.path })
    } else if (data.type === 'rs:hide-window') {
      getCurrentWindow().hide().catch(() => {})
    } else if (data.type === 'rs:back') {
      window.dispatchEvent(new CustomEvent('rs-plugin-back', { detail: { pluginId: init.plugin_id } }))
    } else if (data.type === 'rs:set-size') {
      window.dispatchEvent(new CustomEvent('rs-plugin-resize', { detail: { width: data.width, height: data.height, explicit: true } }))
    } else if (data.type === 'rs:resize') {
      window.dispatchEvent(new CustomEvent('rs-plugin-resize', { detail: { width: data.width, height: data.height, explicit: false } }))
    } else if (data.type === 'rs:log') {
      const lvl = data.level || 'info'
      const fn = console[lvl as 'info' | 'warn' | 'error'] || console.log
      fn('[plugin:' + init.plugin_id + ']', ...(data.args || []))
    }
  }

  async function load(pluginIdValue: string, query: string) {
    if (handshakeTimer) { clearTimeout(handshakeTimer); handshakeTimer = null }
    error.value = null
    ready.value = false
    loading.value = true
    try {
      const init = await invoke<IframeInit>('get_plugin_iframe_init', {
        pluginId: pluginIdValue,
        query,
      })
      if (!init) {
        error.value = `Plugin ${pluginIdValue} has no renderer`
        return
      }
      currentInit.value = init
      const iframe = iframeRef.value
      if (!iframe) {
        error.value = 'Iframe element not mounted'
        return
      }
      iframe.srcdoc = buildSrcdoc(init)
      handshakeTimer = setTimeout(() => {
        if (!ready.value) {
          error.value = 'Plugin iframe handshake timeout'
        }
      }, 5000)
    } catch (e) {
      error.value = `Failed to load plugin ${pluginIdValue}: ${e}`
    } finally {
      loading.value = false
    }
  }

  function unload() {
    if (handshakeTimer) { clearTimeout(handshakeTimer); handshakeTimer = null }
    ready.value = false
    currentInit.value = null
    const iframe = iframeRef.value
    if (iframe) iframe.srcdoc = ''
  }

  function postToIframe(type: string, payload: Record<string, unknown> = {}) {
    const iframe = iframeRef.value
    if (!iframe?.contentWindow) return
    iframe.contentWindow.postMessage({ type, protocol: 'iframe-renderer/1', ...payload }, '*')
  }

  function doSearch(query: string) {
    postToIframe('rs:query-change', { query })
  }

  function onKeyDown(e: KeyboardEvent) {
    postToIframe('rs:keydown', {
      payload: {
        type: e.type,
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        which: e.which,
        alt: e.altKey,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        meta: e.metaKey,
        repeat: e.repeat,
      },
    })
  }

  function setTheme(newTheme: RSTheme) {
    postToIframe('rs:theme-change', { theme: newTheme })
  }

  watch(() => pluginId.value, (id) => {
    if (!id) {
      unload()
    }
  })

  unsubTheme = theme.subscribe((t) => {
    if (ready.value) setTheme(t)
  })

  window.addEventListener('message', onMessage)

  onBeforeUnmount(() => {
    window.removeEventListener('message', onMessage)
    if (handshakeTimer) { clearTimeout(handshakeTimer); handshakeTimer = null }
    if (unsubTheme) { unsubTheme(); unsubTheme = null }
    unload()
  })

  return {
    ready,
    error,
    loading,
    load,
    unload,
    doSearch,
    onKeyDown,
    setTheme,
  }
}
