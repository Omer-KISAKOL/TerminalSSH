import { useEffect, useMemo, useState } from 'react'

import type { ContextCommandSuggestion } from '@shared/contracts/server-ops'

import { useServerOps } from '@/hooks/useServerOps'
import { useServerOpsFeatures } from '@/hooks/useServerOpsFeatures'
import { useServerOpsModules } from '@/hooks/useServerOpsModules'
import { useLocale } from '@/hooks/useLocale'

import {
  ConfigDriftView,
  DiskSpaceAnalyzerView,
  EndpointMonitorView,
  EnvironmentInspectorView,
  IncidentAnalyzerView,
} from './ServerOpsAdvancedViews'
import { ContextSuggestionsView } from './ContextSuggestionsView'
import { DependencyIntelligenceView } from './DependencyIntelligenceView'
import { OperationalTimelineView } from './OperationalTimelineView'
import { ProcessExplorerView } from './ProcessExplorerView'
import { ServerIntelligenceView } from './ServerIntelligenceView'
import { ServerOpsTabNav } from './ServerOpsTabNav'

export type ServerOpsTab =
  | 'intelligence'
  | 'timeline'
  | 'context'
  | 'dependencies'
  | 'processes'
  | 'disk'
  | 'drift'
  | 'env'
  | 'endpoints'
  | 'incident'

type ServerOpsPanelProps = {
  sessionId: string | null
  connected: boolean
  embedded?: boolean
  onPasteCommand: (command: string) => void
}

export function ServerOpsPanel({
  sessionId,
  connected,
  embedded = false,
  onPasteCommand,
}: ServerOpsPanelProps) {
  const { t } = useLocale()
  const features = useServerOpsFeatures()
  const [tab, setTab] = useState<ServerOpsTab>('intelligence')
  const ops = useServerOps(sessionId, connected)
  const modules = useServerOpsModules(sessionId, connected)

  const tabs = useMemo(() => {
    const items: ServerOpsTab[] = []
    if (features.intelligence) items.push('intelligence')
    if (features.timeline) items.push('timeline')
    if (features.context) items.push('context')
    if (features.dependencyIntelligence) items.push('dependencies')
    if (features.processExplorer) items.push('processes')
    if (features.diskSpaceAnalyzer) items.push('disk')
    if (features.configDriftDetector) items.push('drift')
    if (features.environmentInspector) items.push('env')
    if (features.endpointMonitor) items.push('endpoints')
    if (features.incidentAnalyzer) items.push('incident')
    return items
  }, [features])

  useEffect(() => {
    modules.reset()
  }, [modules.reset, sessionId])

  useEffect(() => {
    if (tabs.length === 0) {
      return
    }
    if (!tabs.includes(tab)) {
      setTab(tabs[0])
    }
  }, [tab, tabs])

  useEffect(() => {
    if (tab === 'intelligence' && connected && sessionId && !ops.snapshot && !ops.isCollecting && !ops.isLoading) {
      void ops.collectIntelligence()
    }
  }, [connected, ops, sessionId, tab])

  useEffect(() => {
    if (tab === 'dependencies' && connected && sessionId && !ops.dependencySnapshot && !ops.isCollectingDependencies) {
      void ops.collectDependencies()
    }
  }, [connected, ops, sessionId, tab])

  useEffect(() => {
    if (tab === 'processes' && connected && sessionId && !ops.processSnapshot && !ops.isCollectingProcesses) {
      void ops.collectProcesses()
    }
  }, [connected, ops, sessionId, tab])

  useEffect(() => {
    if (tab === 'disk' && connected && sessionId && !modules.disk && !modules.collecting.disk) {
      void modules.collectDisk()
    }
  }, [
    connected,
    modules.collectDisk,
    modules.collecting.disk,
    modules.disk,
    sessionId,
    tab,
  ])

  useEffect(() => {
    if (tab === 'drift' && connected && sessionId && !modules.drift && !modules.collecting.drift) {
      void modules.collectDrift()
    }
  }, [
    connected,
    modules.collectDrift,
    modules.collecting.drift,
    modules.drift,
    sessionId,
    tab,
  ])

  useEffect(() => {
    if (tab === 'env' && connected && sessionId && !modules.env && !modules.collecting.env) {
      void modules.collectEnv()
    }
  }, [connected, modules.collectEnv, modules.collecting.env, modules.env, sessionId, tab])

  useEffect(() => {
    if (tab === 'endpoints' && connected && sessionId && !modules.endpoints && !modules.collecting.endpoints) {
      void modules.collectEndpoints()
    }
  }, [
    connected,
    modules.collectEndpoints,
    modules.collecting.endpoints,
    modules.endpoints,
    sessionId,
    tab,
  ])

  useEffect(() => {
    if (tab === 'incident' && connected && sessionId && !modules.incident && !modules.collecting.incident) {
      void modules.collectIncident()
    }
  }, [
    connected,
    modules.collectIncident,
    modules.collecting.incident,
    modules.incident,
    sessionId,
    tab,
  ])

  const handleApprovePaste = async (suggestion: ContextCommandSuggestion) => {
    onPasteCommand(suggestion.command)
    await ops.recordSuggestion(suggestion)
  }

  const rootClass = embedded
    ? 'flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden bg-surface-raised'
    : 'flex w-80 min-h-0 min-w-0 shrink-0 flex-col border-l border-border bg-surface lg:w-96'

  const panelError = ops.error ?? modules.error

  if (!connected || !sessionId) {
    return (
      <aside className={rootClass}>
        {!embedded ? (
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-text">{t('serverOps.panelTitle')}</h2>
          </div>
        ) : null}
        <p className="p-4 text-sm text-text-muted">{t('serverOps.panelDisconnected')}</p>
      </aside>
    )
  }

  return (
    <aside className={rootClass}>
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        {!embedded ? (
          <h2 className="truncate px-1 text-sm font-semibold text-text">{t('serverOps.panelTitle')}</h2>
        ) : null}
        {ops.context ? (
          <p className="truncate px-1 text-sm font-medium text-text" title={ops.context.host}>
            {ops.context.host}
          </p>
        ) : null}
      </div>

      <ServerOpsTabNav
        tabs={tabs}
        active={tab}
        onChange={setTab}
        labelKey={(key) => t(`serverOps.tabs.${key}`)}
      />

      <div className="scroll-thin flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-3">
        {tabs.length === 0 ? (
          <p className="text-sm text-text-muted">{t('serverOps.modulesDisabled')}</p>
        ) : null}
        {panelError ? (
          <p className="mb-2 rounded-lg border border-status-error/35 bg-status-error/10 px-2 py-1.5 text-xs text-status-error">
            {panelError}
          </p>
        ) : null}

        {tab === 'intelligence' && features.intelligence ? (
          <ServerIntelligenceView
            snapshot={ops.snapshot}
            isCollecting={ops.isCollecting}
            onCollect={() => void ops.collectIntelligence()}
          />
        ) : null}

        {tab === 'timeline' && features.timeline ? (
          <OperationalTimelineView
            events={ops.timeline}
            retentionDays={ops.retentionDays}
            isLoading={ops.isLoading}
            onRefresh={() => void ops.refreshTimeline()}
          />
        ) : null}

        {tab === 'context' && features.context ? (
          <ContextSuggestionsView suggestions={ops.suggestions} onApprovePaste={handleApprovePaste} />
        ) : null}

        {tab === 'dependencies' && features.dependencyIntelligence ? (
          <DependencyIntelligenceView
            snapshot={ops.dependencySnapshot}
            isCollecting={ops.isCollectingDependencies}
            onCollect={() => void ops.collectDependencies()}
          />
        ) : null}

        {tab === 'processes' && features.processExplorer ? (
          <ProcessExplorerView
            snapshot={ops.processSnapshot}
            isCollecting={ops.isCollectingProcesses}
            onCollect={() => void ops.collectProcesses()}
          />
        ) : null}

        {tab === 'disk' && features.diskSpaceAnalyzer ? (
          <DiskSpaceAnalyzerView
            snapshot={modules.disk}
            isCollecting={modules.collecting.disk}
            onCollect={() => void modules.collectDisk()}
          />
        ) : null}

        {tab === 'drift' && features.configDriftDetector ? (
          <ConfigDriftView
            snapshot={modules.drift}
            isCollecting={modules.collecting.drift}
            onCollect={() => void modules.collectDrift()}
            onResetBaseline={() => void modules.collectDrift(true)}
          />
        ) : null}

        {tab === 'env' && features.environmentInspector ? (
          <EnvironmentInspectorView
            snapshot={modules.env}
            isCollecting={modules.collecting.env}
            onCollect={() => void modules.collectEnv()}
          />
        ) : null}

        {tab === 'endpoints' && features.endpointMonitor ? (
          <EndpointMonitorView
            snapshot={modules.endpoints}
            isCollecting={modules.collecting.endpoints}
            onCollect={() => void modules.collectEndpoints()}
          />
        ) : null}

        {tab === 'incident' && features.incidentAnalyzer ? (
          <IncidentAnalyzerView
            snapshot={modules.incident}
            isCollecting={modules.collecting.incident}
            onCollect={() => void modules.collectIncident()}
          />
        ) : null}
      </div>
    </aside>
  )
}