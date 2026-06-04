export interface SearchResult {
  plugin_id: string
  title: string
  subtitle: string
  relevance: number
  icon_path: string
  action: string
  template: string
}

export interface RSTheme {
  mode: 'dark' | 'light'
  vars: Record<string, string>
  name?: string
}

export interface PluginIframeInit {
  plugin_id: string
  sdk_js: string
  base_dir: string
  renderer_path: string
  html_content: string
  query: string
  config: Record<string, unknown>
  version: string
}