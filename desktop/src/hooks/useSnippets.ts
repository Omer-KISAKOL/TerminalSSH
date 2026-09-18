import { useCallback, useEffect, useState } from 'react'

import type { ProfileSnippet, SaveSnippetRequest } from '@shared/contracts/snippet'

export function useSnippets(profileId: string | null | undefined) {
  const [snippets, setSnippets] = useState<ProfileSnippet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!profileId) {
      setSnippets([])
      return
    }

    setIsLoading(true)

    try {
      const list = await window.desktopApi.snippets.list(profileId)
      setSnippets(list)
      setError(null)
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Snippet listesi alınamadı.')
    } finally {
      setIsLoading(false)
    }
  }, [profileId])

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
      if (!profileId) {
        return
      }

      await window.desktopApi.snippets.remove(profileId, snippetId)
      await refresh()
    },
    [profileId, refresh],
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
