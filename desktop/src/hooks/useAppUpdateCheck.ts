import { useCallback, useEffect, useState } from 'react'

import type { ReleaseCheckResponse } from '@shared/contracts/release'

function isUpdateRelevant(status: ReleaseCheckResponse): boolean {
  if (!status.updateAvailable) {
    return false
  }

  const phase = status.phase ?? 'available'
  return phase === 'available' || phase === 'downloading' || phase === 'ready'
}

export function useAppUpdateCheck(enabled: boolean) {
  const [update, setUpdate] = useState<ReleaseCheckResponse | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!enabled) {
      return
    }

    let cancelled = false

    const applyStatus = (status: ReleaseCheckResponse) => {
      if (cancelled) {
        return
      }

      if (isUpdateRelevant(status)) {
        setUpdate(status)
        return
      }

      if (status.phase === 'idle' || status.phase === 'error') {
        setUpdate(null)
      }
    }

    const unsubscribe = window.desktopApi.app.onUpdateStatus(applyStatus)

    void window.desktopApi.app
      .checkForUpdate()
      .then(applyStatus)
      .catch(() => {
        // Ağ/API hatasında sessiz kal — sürekli bildirim yok.
      })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [enabled])

  const dismiss = useCallback(() => {
    if (update?.phase !== 'ready') {
      setDismissed(true)
    }
  }, [update?.phase])

  const install = useCallback(async () => {
    if (!update) {
      return
    }

    if (update.nativeAutoUpdate) {
      if (update.phase === 'ready') {
        await window.desktopApi.app.quitAndInstall()
        return
      }

      return
    }

    if (update.downloadUrl) {
      await window.desktopApi.app.openUpdateDownload(update.downloadUrl)
    }
  }, [update])

  const showDialog = Boolean(update) && (update?.phase === 'ready' || !dismissed)

  return {
    update: showDialog ? update : null,
    dismiss,
    install,
  }
}