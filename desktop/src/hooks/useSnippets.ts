import { useCallback, useEffect, useState } from 'react'

import type { SaveSnippetRequest, Snippet } from '@shared/contracts/snippet'

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)

    try {
      const list = await window.desktopApi.snippets.list()
      setSnippets(list)
      setError(null)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Snippet listesi alınamadı.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const save = useCallback(
    async (input: SaveSnippetRequest) => {
      const snippet = await window.desktopApi.snippets.save(input)
      await refresh()
      return snippet
    },
    [refresh],
  )

  const remove = useCallback(
    async (snippetId: string) => {
      await window.desktopApi.snippets.remove(snippetId)
      await refresh()
    },
    [refresh],
  )

  return {
    snippets,
    isLoading,
    error,
    refresh,
    save,
    remove,
  }
}
