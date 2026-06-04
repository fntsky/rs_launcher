import { LogicalSize } from '@tauri-apps/api/window'
import { useTauri } from './useTauri'

const WINDOW_WIDTH = 640
const WINDOW_HEIGHT_COLLAPSED = 80
const WINDOW_HEIGHT_EXPANDED = 420
const WINDOW_HEIGHT_PLUGIN = 500

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
      await appWindow.setSize(new LogicalSize(WINDOW_WIDTH, WINDOW_HEIGHT_PLUGIN))
    } catch (e) {
      console.error('Failed to set window size:', e)
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

  return { setWindowSize, setPluginWindowSize, hideWindow }
}