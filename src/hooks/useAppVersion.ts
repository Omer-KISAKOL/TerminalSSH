import { useEffect, useState } from 'react'

export function useAppVersion(): string | null {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void window.desktopApi.app.getVersion().then((value) => {
      if (!cancelled) {
        setVersion(value)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return version
}
