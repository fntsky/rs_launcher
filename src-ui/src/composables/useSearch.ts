import { useTauri } from './useTauri'
import type { SearchResult } from '../types'

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let lastSearchId = 0

export function useSearch() {
  const { invoke } = useTauri()

  async function search(query: string): Promise<SearchResult[]> {
    const searchId = ++lastSearchId
    try {
      const res = await invoke<SearchResult[]>('search', { query })
      if (searchId !== lastSearchId) return []
      return res
    } catch (e) {
      console.error('Search error:', e)
      return []
    }
  }

  function debouncedSearch(query: string, callback: (results: SearchResult[]) => void) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      const results = await search(query)
      callback(results)
    }, 80)
  }

  return { search, debouncedSearch }
}
