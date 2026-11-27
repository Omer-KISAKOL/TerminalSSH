import { useCallback, useEffect, useState } from 'react'

import {
  buildServerOpsFlagsAll,
  loadServerOpsFeatureFlags,
  saveServerOpsFeatureFlags,
  SERVER_OPS_FEATURES_CHANGED,
  type ServerOpsFeatureFlags,
} from '@/lib/server-ops-features-storage'

export function useServerOpsFeatures() {
  const [flags, setFlags] = useState<ServerOpsFeatureFlags>(() => loadServerOpsFeatureFlags())

  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<ServerOpsFeatureFlags>).detail
      if (detail) {
        setFlags(detail)
        return
      }

      setFlags(loadServerOpsFeatureFlags())
    }

    window.addEventListener(SERVER_OPS_FEATURES_CHANGED, onChange)
    return () => window.removeEventListener(SERVER_OPS_FEATURES_CHANGED, onChange)
  }, [])

  const patchFlags = useCallback((patch: Partial<ServerOpsFeatureFlags>) => {
    const next = { ...loadServerOpsFeatureFlags(), ...patch }
    saveServerOpsFeatureFlags(next)
    setFlags(next)
  }, [])

  const setIntelligence = useCallback((enabled: boolean) => patchFlags({ intelligence: enabled }), [patchFlags])
  const setTimeline = useCallback((enabled: boolean) => patchFlags({ timeline: enabled }), [patchFlags])
  const setContext = useCallback((enabled: boolean) => patchFlags({ context: enabled }), [patchFlags])
  const setDependencyIntelligence = useCallback(
    (enabled: boolean) => patchFlags({ dependencyIntelligence: enabled }),
    [patchFlags],
  )
  const setProcessExplorer = useCallback((enabled: boolean) => patchFlags({ processExplorer: enabled }), [patchFlags])
  const setDiskSpaceAnalyzer = useCallback(
    (enabled: boolean) => patchFlags({ diskSpaceAnalyzer: enabled }),
    [patchFlags],
  )
  const setConfigDriftDetector = useCallback(
    (enabled: boolean) => patchFlags({ configDriftDetector: enabled }),
    [patchFlags],
  )
  const setEnvironmentInspector = useCallback(
    (enabled: boolean) => patchFlags({ environmentInspector: enabled }),
    [patchFlags],
  )
  const setEndpointMonitor = useCallback(
    (enabled: boolean) => patchFlags({ endpointMonitor: enabled }),
    [patchFlags],
  )
  const setIncidentAnalyzer = useCallback(
    (enabled: boolean) => patchFlags({ incidentAnalyzer: enabled }),
    [patchFlags],
  )

  const enableAll = useCallback(() => {
    const next = buildServerOpsFlagsAll(true)
    saveServerOpsFeatureFlags(next)
    setFlags(next)
  }, [])

  const disableAll = useCallback(() => {
    const next = buildServerOpsFlagsAll(false)
    saveServerOpsFeatureFlags(next)
    setFlags(next)
  }, [])

  return {
    ...flags,
    setIntelligence,
    setTimeline,
    setContext,
    setDependencyIntelligence,
    setProcessExplorer,
    setDiskSpaceAnalyzer,
    setConfigDriftDetector,
    setEnvironmentInspector,
    setEndpointMonitor,
    setIncidentAnalyzer,
    enableAll,
    disableAll,
  }
}