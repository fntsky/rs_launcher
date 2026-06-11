import { ref, readonly, type Ref } from 'vue'
import type { ThemeDTO } from '../types'

export interface RSTheme {
  mode: 'dark' | 'light'
  vars: Record<string, string>
  name?: string
}

const DARK_THEME: RSTheme = {
  mode: 'dark',
  vars: {
    '--bg-primary': '#1e1e22',
    '--bg-secondary': '#2a2a30',
    '--bg-hover': '#3a3a42',
    '--bg-selected': '#2a3a5a',
    '--text-primary': '#e0e0e0',
    '--text-secondary': '#6a6a72',
    '--text-hint': '#585860',
    '--accent': '#4a90d9',
    '--divider': '#3a3a42',
  },
}

let singletonTheme: ReturnType<typeof createTheme> | null = null

function createTheme() {
  const current = ref<RSTheme>({ ...DARK_THEME, vars: { ...DARK_THEME.vars } })
  const subscribers = new Set<(t: RSTheme) => void>()

  function applyToRoot(theme: RSTheme) {
    const root = document.documentElement
    root.dataset.theme = theme.mode
    for (const k in theme.vars) {
      root.style.setProperty(k, theme.vars[k])
    }
  }

  applyToRoot(current.value)

  function setTheme(theme: RSTheme) {
    const plain: RSTheme = { mode: theme.mode, vars: { ...theme.vars } }
    current.value = plain
    applyToRoot(plain)
    subscribers.forEach((fn) => {
      try { fn(plain) } catch (e) { console.error('[theme] subscriber error', e) }
    })
  }

  function subscribe(fn: (t: RSTheme) => void): () => void {
    subscribers.add(fn)
    return () => subscribers.delete(fn)
  }

  return {
    current: readonly(current) as Readonly<Ref<RSTheme>>,
    setTheme,
    subscribe,
    loadTheme(t: ThemeDTO) {
      setTheme({ mode: t.mode as 'dark' | 'light', vars: { ...t.vars }, name: t.name })
    },
  }
}

export function useTheme() {
  if (!singletonTheme) singletonTheme = createTheme()
  return singletonTheme
}

export function defaultTheme(): RSTheme {
  return { mode: 'dark', vars: { ...DARK_THEME.vars } }
}
