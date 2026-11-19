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

  const reorder = useCallback(async (orderedIds: string[]) => {
    let snapshot: Snippet[] | null = null

    setSnippets((current) => {
      snapshot = current
      const byId = new Map(current.map((snippet) => [snippet.id, snippet]))
      return orderedIds.flatMap((id, index) => {
        const snippet = byId.get(id)
        return snippet ? [{ ...snippet, sortOrder: index }] : []
      })
    })

    try {
      const list = await window.desktopApi.snippets.reorder(orderedIds)
      setSnippets(list)
      setError(null)
    } catch (reorderError) {
      if (snapshot) {
        setSnippets(snapshot)
      }
      setError(reorderError instanceof Error ? reorderError.message : 'Snippet sırası güncellenemedi.')
      throw reorderError
    }
  }, [])

  return {
    snippets,
    isLoading,
    error,
    refresh,
    save,
    remove,
    reorder,
  }
}
