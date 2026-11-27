import { useCallback, useState } from 'react'

import type { EndpointMonitorSnapshot, IncidentAnalyzerSnapshot } from '@shared/contracts/server-ops'

type CollectingFlags = {
  endpoints: boolean
  incident: boolean
}

type ModuleSnapshots = {
  endpoints: EndpointMonitorSnapshot | null
  incident: IncidentAnalyzerSnapshot | null
}

const emptySnapshots: ModuleSnapshots = {
  endpoints: null,
  incident: null,
}

const emptyCollecting: CollectingFlags = {
  endpoints: false,
  incident: false,
}

const API_STALE_MESSAGE =
  'Sunucu modülleri yüklenemedi. Geliştirme modunda uygulamayı tamamen kapatıp (pnpm dev) yeniden başlatın.'

function ensureServerOpsApi(method: string): boolean {
  const api = window.desktopApi?.serverOps as Record<string, unknown> | undefined
  return typeof api?.[method] === 'function'
}

export function useServerOpsModules(sessionId: string | null, connected: boolean) {
  const [snapshots, setSnapshots] = useState<ModuleSnapshots>(emptySnapshots)
  const [collecting, setCollecting] = useState<CollectingFlags>(emptyCollecting)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setSnapshots(emptySnapshots)
    setCollecting(emptyCollecting)
    setError(null)
  }, [])

  const collectEndpoints = useCallback(async () => {
    if (!sessionId || !connected) {
      return
    }
    if (!ensureServerOpsApi('collectEndpointMonitor')) {
      setError(API_STALE_MESSAGE)
      return
    }

    setCollecting((state) => ({ ...state, endpoints: true }))
    setError(null)
    try {
      const result = await window.desktopApi.serverOps.collectEndpointMonitor(sessionId)
      setSnapshots((state) => ({ ...state, endpoints: result.snapshot }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Endpoint taraması başarısız.')
    } finally {
      setCollecting((state) => ({ ...state, endpoints: false }))
    }
  }, [connected, sessionId])

  const collectIncident = useCallback(async () => {
    if (!sessionId || !connected) {
      return
    }
    if (!ensureServerOpsApi('collectIncidentAnalyzer')) {
      setError(API_STALE_MESSAGE)
      return
    }

    setCollecting((state) => ({ ...state, incident: true }))
    setError(null)
    try {
      const result = await window.desktopApi.serverOps.collectIncidentAnalyzer(sessionId)
      setSnapshots((state) => ({ ...state, incident: result.snapshot }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Olay analizi başarısız.')
    } finally {
      setCollecting((state) => ({ ...state, incident: false }))
    }
  }, [connected, sessionId])

  return {
    ...snapshots,
    collecting,
    error,
    reset,
    collectEndpoints,
    collectIncident,
  }
}