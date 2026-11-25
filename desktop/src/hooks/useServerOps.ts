import { useCallback, useEffect, useState } from 'react'

import type {
  ContextCommandSuggestion,
  DependencyIntelligenceSnapshot,
  OperationalTimelineEvent,
  ProcessExplorerSnapshot,
  ServerIntelligenceSnapshot,
  ServerOpsContextResponse,
} from '@shared/contracts/server-ops'

type UseServerOpsState = {
  context: ServerOpsContextResponse | null
  snapshot: ServerIntelligenceSnapshot | null
  dependencySnapshot: DependencyIntelligenceSnapshot | null
  processSnapshot: ProcessExplorerSnapshot | null
  suggestions: ContextCommandSuggestion[]
  timeline: OperationalTimelineEvent[]
  retentionDays: number
  isLoading: boolean
  isCollecting: boolean
  isCollectingDependencies: boolean
  isCollectingProcesses: boolean
  error: string | null
}

const initialState: UseServerOpsState = {
  context: null,
  snapshot: null,
  dependencySnapshot: null,
  processSnapshot: null,
  suggestions: [],
  timeline: [],
  retentionDays: 3,
  isLoading: false,
  isCollecting: false,
  isCollectingDependencies: false,
  isCollectingProcesses: false,
  error: null,
}

export function useServerOps(sessionId: string | null, enabled: boolean) {
  const [state, setState] = useState<UseServerOpsState>(initialState)

  const refreshContext = useCallback(async () => {
    if (!sessionId || !enabled || !window.desktopApi?.serverOps) {
      setState(initialState)
      return
    }

    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const context = await window.desktopApi.serverOps.getContext(sessionId)
      const timelineResponse = await window.desktopApi.serverOps.listTimeline({
        serverKey: context.serverKey,
        limit: 100,
      })

      setState((current) => ({
        ...current,
        context,
        snapshot: context.snapshot,
        suggestions: context.suggestions,
        timeline: timelineResponse.events,
        retentionDays: timelineResponse.retentionDays,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sunucu bilgisi yüklenemedi.'
      setState((current) => ({ ...current, isLoading: false, error: message }))
    }
  }, [enabled, sessionId])

  const collectIntelligence = useCallback(async () => {
    if (!sessionId || !enabled || !window.desktopApi?.serverOps) {
      return
    }

    setState((current) => ({ ...current, isCollecting: true, error: null }))

    try {
      const result = await window.desktopApi.serverOps.collectIntelligence(sessionId)
      const context = await window.desktopApi.serverOps.getContext(sessionId)
      const timelineResponse = await window.desktopApi.serverOps.listTimeline({
        serverKey: context.serverKey,
        limit: 100,
      })

      setState((current) => ({
        ...current,
        context,
        snapshot: result.snapshot,
        suggestions: result.suggestions,
        timeline: timelineResponse.events,
        isCollecting: false,
        error: null,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sunucu taraması başarısız.'
      setState((current) => ({ ...current, isCollecting: false, error: message }))
    }
  }, [enabled, sessionId])

  const refreshTimeline = useCallback(async () => {
    if (!state.context || !window.desktopApi?.serverOps) {
      return
    }

    const timelineResponse = await window.desktopApi.serverOps.listTimeline({
      serverKey: state.context.serverKey,
      limit: 100,
    })

    setState((current) => ({
      ...current,
      timeline: timelineResponse.events,
      retentionDays: timelineResponse.retentionDays,
    }))
  }, [state.context])

  const collectDependencies = useCallback(async () => {
    if (!sessionId || !enabled || !window.desktopApi?.serverOps?.collectDependencies) {
      return
    }

    setState((current) => ({ ...current, isCollectingDependencies: true, error: null }))

    try {
      const result = await window.desktopApi.serverOps.collectDependencies(sessionId)
      setState((current) => ({
        ...current,
        dependencySnapshot: result.snapshot,
        isCollectingDependencies: false,
        error: null,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bağımlılık taraması başarısız.'
      setState((current) => ({ ...current, isCollectingDependencies: false, error: message }))
    }
  }, [enabled, sessionId])

  const collectProcesses = useCallback(async () => {
    if (!sessionId || !enabled || !window.desktopApi?.serverOps?.collectProcesses) {
      return
    }

    setState((current) => ({ ...current, isCollectingProcesses: true, error: null }))

    try {
      const result = await window.desktopApi.serverOps.collectProcesses(sessionId)
      setState((current) => ({
        ...current,
        processSnapshot: result.snapshot,
        isCollectingProcesses: false,
        error: null,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'İşlem listesi alınamadı.'
      setState((current) => ({ ...current, isCollectingProcesses: false, error: message }))
    }
  }, [enabled, sessionId])

  const recordSuggestion = useCallback(
    async (suggestion: ContextCommandSuggestion) => {
      if (!sessionId || !window.desktopApi?.serverOps) {
        return
      }

      await window.desktopApi.serverOps.recordSuggestion({
        sessionId,
        label: suggestion.label,
        command: suggestion.command,
      })
      await refreshTimeline()
    },
    [refreshTimeline, sessionId],
  )

  useEffect(() => {
    if (!enabled || !sessionId) {
      setState(initialState)
      return
    }

    void refreshContext()
  }, [enabled, refreshContext, sessionId])

  useEffect(() => {
    if (!enabled || !sessionId) {
      return
    }

    const timer = window.setInterval(() => {
      void refreshTimeline()
    }, 20_000)

    return () => window.clearInterval(timer)
  }, [enabled, refreshTimeline, sessionId])

  return {
    ...state,
    refreshContext,
    collectIntelligence,
    collectDependencies,
    collectProcesses,
    refreshTimeline,
    recordSuggestion,
  }
}