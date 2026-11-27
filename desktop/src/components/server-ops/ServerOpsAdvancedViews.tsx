import type { ReactNode } from 'react'

import type { EndpointMonitorSnapshot, IncidentAnalyzerSnapshot } from '@shared/contracts/server-ops'
import { endpointMonitorHasPayload } from '@shared/server-ops/endpoint-monitor-parser'
import { incidentAnalyzerHasPayload } from '@shared/server-ops/incident-analyzer-parser'

import { useLocale } from '@/hooks/useLocale'

import { ServerOpsModuleFrame } from './ServerOpsModuleFrame'

function WarningList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return null
  }

  return (
    <ul className="space-y-1 rounded-lg border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-xs text-text-muted">
      {warnings.map((warning) => (
        <li key={warning}>{warning}</li>
      ))}
    </ul>
  )
}

type ScanViewProps = {
  isCollecting: boolean
  onCollect: () => void
}

function ScanContent({
  isCollecting,
  snapshot,
  emptyText,
  scanEmptyText,
  noData,
  warnings = [],
  children,
}: {
  isCollecting: boolean
  snapshot: unknown | null
  emptyText: string
  scanEmptyText: string
  noData: boolean
  warnings?: string[]
  children: ReactNode
}) {
  const { t } = useLocale()

  if (isCollecting && !snapshot) {
    return <p className="text-sm text-text-muted">{t('common.loading')}</p>
  }

  if (!snapshot) {
    return <p className="text-sm text-text-muted">{emptyText}</p>
  }

  if (noData) {
    return (
      <>
        <WarningList warnings={warnings} />
        <p className="text-sm text-text-muted">{scanEmptyText}</p>
      </>
    )
  }

  return (
    <>
      <WarningList warnings={warnings} />
      {children}
    </>
  )
}

export function EndpointMonitorView({
  snapshot,
  isCollecting,
  onCollect,
}: ScanViewProps & { snapshot: EndpointMonitorSnapshot | null }) {
  const { t } = useLocale()

  const statusClass = (status: string) => {
    if (status === 'ok') {
      return 'text-status-success'
    }
    if (status === 'degraded') {
      return 'text-status-warning'
    }
    if (status === 'listening') {
      return 'text-text-muted'
    }
    if (status === 'unknown') {
      return 'text-status-warning'
    }
    return 'text-status-error'
  }

  const statusLabel = (status: string) => {
    if (status === 'listening') {
      return t('serverOps.endpointListening')
    }
    return status
  }

  const httpProbes = snapshot?.probes.filter((probe) => probe.kind === 'http') ?? []
  const listenerProbes = snapshot?.probes.filter((probe) => probe.kind === 'listener') ?? []

  return (
    <ServerOpsModuleFrame
      title={t('serverOps.endpointsTitle')}
      subtitle={t('serverOps.endpointsSubtitle')}
      isCollecting={isCollecting}
      hasSnapshot={Boolean(snapshot)}
      onCollect={onCollect}
      refreshLabel={t('serverOps.refreshScan')}
      startLabel={t('serverOps.startScan')}
    >
      <ScanContent
        isCollecting={isCollecting}
        snapshot={snapshot}
        emptyText={t('serverOps.endpointsEmpty')}
        scanEmptyText={t('serverOps.moduleScanEmpty')}
        noData={snapshot ? !endpointMonitorHasPayload(snapshot) : false}
        warnings={snapshot?.warnings}
      >
        {snapshot ? (
          <div className="space-y-3">
            {httpProbes.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                  {t('serverOps.endpointHttpSection')}
                </p>
                <ul className="space-y-1.5">
                  {httpProbes.map((probe) => (
                    <li key={probe.url} className="min-w-0 rounded border border-border px-2 py-1.5 text-xs">
                      <p className={`font-semibold ${statusClass(probe.status)}`}>{statusLabel(probe.status)}</p>
                      <p className="truncate text-text" title={probe.url}>
                        {probe.label ? `${probe.label} · ` : ''}
                        {probe.url}
                      </p>
                      <p className="text-text-muted">
                        HTTP {probe.httpStatus ?? '—'} ·{' '}
                        {probe.responseMs != null ? `${probe.responseMs.toFixed(0)} ms` : '—'}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-text-muted">{t('serverOps.endpointHttpMissing')}</p>
            )}
            {listenerProbes.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                  {t('serverOps.endpointListenersSection')}
                </p>
                <ul className="space-y-1.5">
                  {listenerProbes.map((probe) => (
                    <li key={probe.url} className="min-w-0 rounded border border-border px-2 py-1.5 text-xs">
                      <p className={`font-semibold ${statusClass(probe.status)}`}>{statusLabel(probe.status)}</p>
                      <p className="truncate text-text" title={probe.url}>
                        {probe.label ?? probe.url}
                      </p>
                      <p className="text-text-muted">{probe.url}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </ScanContent>
    </ServerOpsModuleFrame>
  )
}

export function IncidentAnalyzerView({
  snapshot,
  isCollecting,
  onCollect,
}: ScanViewProps & { snapshot: IncidentAnalyzerSnapshot | null }) {
  const { t } = useLocale()

  return (
    <ServerOpsModuleFrame
      title={t('serverOps.incidentTitle')}
      subtitle={t('serverOps.incidentSubtitle')}
      isCollecting={isCollecting}
      hasSnapshot={Boolean(snapshot)}
      onCollect={onCollect}
      refreshLabel={t('serverOps.refreshScan')}
      startLabel={t('serverOps.startScan')}
    >
      <ScanContent
        isCollecting={isCollecting}
        snapshot={snapshot}
        emptyText={t('serverOps.incidentEmpty')}
        scanEmptyText={t('serverOps.moduleScanEmpty')}
        noData={snapshot ? !incidentAnalyzerHasPayload(snapshot) : false}
        warnings={snapshot?.warnings}
      >
        {snapshot ? (
          <>
            <ul className="space-y-1 text-xs text-text">
              {snapshot.likelyCauses.map((cause) => (
                <li key={cause} className="rounded bg-surface-muted/60 px-2 py-1">
                  {cause}
                </li>
              ))}
            </ul>
            <ul className="mt-2 space-y-1">
              {snapshot.signals.slice(0, 12).map((signal) => (
                <li key={signal.id} className="min-w-0 rounded border border-border px-2 py-1 text-xs">
                  <span className="text-text-muted">{signal.category}</span> ·{' '}
                  <span className="text-text">{signal.summary}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </ScanContent>
    </ServerOpsModuleFrame>
  )
}