import { LogicalSize } from '@tauri-apps/api/window'
import { useTauri } from './useTauri'

const WINDOW_WIDTH = 640
const WINDOW_HEIGHT_COLLAPSED = 80
const WINDOW_HEIGHT_EXPANDED = 420
const WINDOW_HEIGHT_PLUGIN_DEFAULT = 560
const SEARCH_BAR_CHROME = 60
const MIN_PLUGIN_CONTENT_HEIGHT = 300
const MAX_WINDOW_HEIGHT = 600

function getChromeHeight(): number {
  if (typeof document === 'undefined') return SEARCH_BAR_CHROME
  const sb = document.querySelector('.search-bar') as HTMLElement | null
  const h = sb?.getBoundingClientRect().height
  return h && h > 0 ? h : SEARCH_BAR_CHROME
}

export function useWindow() {
  const { getCurrentWindow } = useTauri()

  async function setWindowSize(hasResults: boolean) {
    const appWindow = getCurrentWindow()
    const height = hasResults ? WINDOW_HEIGHT_EXPANDED : WINDOW_HEIGHT_COLLAPSED
    try {
      await appWindow.setSize(new LogicalSize(WINDOW_WIDTH, height))
    } catch (e) {
      console.error('Failed to set window size:', e)
    }
  }

  async function setPluginWindowSize() {
    const appWindow = getCurrentWindow()
    try {
      await appWindow.setSize(new LogicalSize(WINDOW_WIDTH, WINDOW_HEIGHT_PLUGIN_DEFAULT))
    } catch (e) {
      console.error('Failed to set window size:', e)
    }
  }

  async function setPluginSize(contentWidth: number, contentHeight: number) {
    const appWindow = getCurrentWindow()
    const chrome = getChromeHeight()
    const clampedContent = Math.max(contentHeight, MIN_PLUGIN_CONTENT_HEIGHT)
    const totalH = Math.min(clampedContent + chrome, MAX_WINDOW_HEIGHT)
    const totalW = contentWidth > WINDOW_WIDTH ? contentWidth : WINDOW_WIDTH
    try {
      await appWindow.setSize(new LogicalSize(totalW, totalH))
    } catch (e) {
      console.error('Failed to set plugin size:', e)
    }
  }

  async function hideWindow() {
    const appWindow = getCurrentWindow()
    try {
      await appWindow.hide()
    } catch (e) {
      console.error('Hide error:', e)
    }
  }

  return { setWindowSize, setPluginWindowSize, setPluginSize, hideWindow }
}
