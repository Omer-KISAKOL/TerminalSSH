import { useCallback, useEffect, useRef, useState } from 'react'

type PathNavigationHistory = {
  canGoBack: boolean
  canGoForward: boolean
  goBack: () => string | null
  goForward: () => string | null
  reset: (path: string) => void
}

export function usePathNavigationHistory(path: string): PathNavigationHistory {
  const [entries, setEntries] = useState<string[]>([])
  const [index, setIndex] = useState(-1)
  const syncingRef = useRef(false)

  const reset = useCallback((nextPath: string) => {
    setEntries([nextPath])
    setIndex(0)
  }, [])

  useEffect(() => {
    if (!path) {
      return
    }

    if (syncingRef.current) {
      syncingRef.current = false
      return
    }

    setEntries((current) => {
      if (current.length === 0) {
        setIndex(0)
        return [path]
      }

      if (current[index] === path) {
        return current
      }

      const truncated = current.slice(0, index + 1)
      const next = [...truncated, path]
      setIndex(next.length - 1)
      return next
    })
  }, [path, index])

  const goBack = useCallback(() => {
    if (index <= 0) {
      return null
    }

    const nextIndex = index - 1
    const target = entries[nextIndex]

    if (!target) {
      return null
    }

    syncingRef.current = true
    setIndex(nextIndex)
    return target
  }, [entries, index])

  const goForward = useCallback(() => {
    if (index >= entries.length - 1) {
      return null
    }

    const nextIndex = index + 1
    const target = entries[nextIndex]

    if (!target) {
      return null
    }

    syncingRef.current = true
    setIndex(nextIndex)
    return target
  }, [entries, index])

  return {
    canGoBack: index > 0,
    canGoForward: index >= 0 && index < entries.length - 1,
    goBack,
    goForward,
    reset,
  }
}