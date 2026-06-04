import { invoke as tauriInvoke, convertFileSrc } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'

export function useTauri() {
  async function invoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
    return tauriInvoke(command, args)
  }

  return {
    invoke,
    convertFileSrc,
    getCurrentWindow,
  }
}