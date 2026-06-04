export interface SearchResult {
  plugin_id: string
  title: string
  subtitle: string
  relevance: number
  icon_path: string
  action: string
  template: string
}

export interface PluginContext {
  query: string
  invoke: (command: string, args: Record<string, unknown>) => Promise<unknown>
  openFile: (path: string) => Promise<void>
  hideWindow: () => Promise<void>
  theme: {
    mode: 'dark' | 'light'
    vars: Record<string, string>
  }
  config: {
    hotkey: string
    [key: string]: unknown
  }
}

export interface PluginConfig {
  id: string
  name: string
  version: string
  dll: string
  vue_component?: string
  renderer?: string
  commands: Array<{
    name: string
    params: string[]
    description: string
  }>
}