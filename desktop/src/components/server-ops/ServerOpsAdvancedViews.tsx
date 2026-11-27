import type { ReactNode } from 'react'

import type {
  ConfigDriftSnapshot,
  DiskSpaceAnalyzerSnapshot,
  EndpointMonitorSnapshot,
  EnvironmentInspectorSnapshot,
  IncidentAnalyzerSnapshot,
} from '@shared/contracts/server-ops'
import { configDriftHasPayload } from '@shared/server-ops/config-drift-parser'
import { diskAnalyzerHasPayload } from '@shared/server-ops/disk-analyzer-parser'
import { endpointMonitorHasPayload } from '@shared/server-ops/endpoint-monitor-parser'
import { incidentAnalyzerHasPayload } from '@shared/server-ops/incident-analyzer-parser'

import { Button } from '@/components/ui/Button'
import { formatBytes } from '@/lib/format-bytes'
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

function UsageBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0

  return (
    <div className="h-1.5 w-full rounded-full bg-surface-muted">
      <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
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

export function DiskSpaceAnalyzerView({
  snapshot,
  isCollecting,
  onCollect,
}: ScanViewProps & { snapshot: DiskSpaceAnalyzerSnapshot | null }) {
  const { t, locale } = useLocale()
  const maxDir = snapshot?.topDirectories[0]?.bytes ?? 1

  return (
    <ServerOpsModuleFrame
      title={t('serverOps.diskTitle')}
      subtitle={t('serverOps.diskSubtitle')}
      isCollecting={isCollecting}
      hasSnapshot={Boolean(snapshot)}
      onCollect={onCollect}
      refreshLabel={t('serverOps.refreshScan')}
      startLabel={t('serverOps.startScan')}
    >
      <ScanContent
        isCollecting={isCollecting}
        snapshot={snapshot}
        emptyText={t('serverOps.diskEmpty')}
        scanEmptyText={t('serverOps.moduleScanEmpty')}
        noData={snapshot ? !diskAnalyzerHasPayload(snapshot) : false}
        warnings={snapshot?.warnings}
      >
        {snapshot ? (
          <>
            {snapshot.mounts.length > 0 ? (
              <section className="space-y-1.5">
                <p className="text-xs font-medium text-text-muted">{t('serverOps.disks')}</p>
                {snapshot.mounts.map((mount) => (
                  <div
                    key={`${mount.mountpoint}-${mount.filesystem}`}
                    className="min-w-0 rounded-lg border border-border px-2 py-1.5 text-xs"
                  >
                    <p className="truncate font-medium text-text" title={mount.mountpoint}>
                      {mount.mountpoint}
                    </p>
                    <p className="text-text-muted">
                      {mount.used} / {mount.size} · {mount.usePercent}
                    </p>
                  </div>
                ))}
              </section>
            ) : null}
            <section className="space-y-2">
              <p className="text-xs font-medium text-text-muted">{t('serverOps.diskTopDirs')}</p>
              {snapshot.topDirectories.map((item) => (
                <div key={item.path} className="min-w-0 rounded-lg border border-border px-2 py-1.5">
                  <UsageRow label={item.path} value={formatBytes(item.bytes, locale)} />
                  <UsageBar value={item.bytes} max={maxDir} />
                </div>
              ))}
            </section>
            <section className="space-y-1">
              <p className="text-xs font-medium text-text-muted">{t('serverOps.diskClutter')}</p>
              {snapshot.clutterItems.concat(snapshot.largeFiles).slice(0, 12).map((item) => (
                <p key={`${item.kind}-${item.path}`} className="truncate text-xs text-text" title={item.path}>
                  <span className="text-text-muted">{item.kind}</span> · {formatBytes(item.bytes, locale)} ·{' '}
                  {item.path}
                </p>
              ))}
            </section>
          </>
        ) : null}
      </ScanContent>
    </ServerOpsModuleFrame>
  )
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-xs">
      <span className="truncate text-text" title={label}>
        {label}
      </span>
      <span className="shrink-0 tabular-nums text-text-muted">{value}</span>
    </div>
  )
}

export function ConfigDriftView({
  snapshot,
  isCollecting,
  onCollect,
  onResetBaseline,
}: ScanViewProps & {
  snapshot: ConfigDriftSnapshot | null
  onResetBaseline: () => void
}) {
  const { t } = useLocale()
  const changes = snapshot?.changes.filter((item) => item.status !== 'unchanged') ?? []

  return (
    <ServerOpsModuleFrame
      title={t('serverOps.driftTitle')}
      subtitle={t('serverOps.driftSubtitle')}
      isCollecting={isCollecting}
      hasSnapshot={Boolean(snapshot)}
      onCollect={onCollect}
      refreshLabel={t('serverOps.refreshScan')}
      startLabel={t('serverOps.startScan')}
    >
      <ScanContent
        isCollecting={isCollecting}
        snapshot={snapshot}
        emptyText={t('serverOps.driftEmpty')}
        scanEmptyText={t('serverOps.moduleScanEmpty')}
        noData={snapshot ? !configDriftHasPayload(snapshot) : false}
        warnings={snapshot?.warnings}
      >
        {snapshot ? (
          <>
            <Button type="button" variant="ghost" className="w-full text-xs" onClick={onResetBaseline}>
              {t('serverOps.driftResetBaseline')}
            </Button>
            {snapshot.isInitialBaseline ? (
              <p className="text-xs text-status-success">{t('serverOps.driftBaselineSaved')}</p>
            ) : null}
            {changes.length === 0 ? (
              <p className="text-xs text-text-muted">{t('serverOps.driftNoChanges')}</p>
            ) : null}
            <ul className="space-y-1.5 text-xs">
              {changes.map((item) => (
                <li key={item.path} className="min-w-0 rounded border border-border px-2 py-1" title={item.path}>
                  <span className="font-medium text-text">{item.status}</span> ·{' '}
                  <span className="truncate">{item.path}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-2 space-y-1 text-[11px] text-text-muted">
              {snapshot.fingerprints.map((fp) => (
                <li key={fp.path} className="truncate" title={fp.path}>
                  {fp.readable ? 'ok' : fp.sha256 === null && fp.sizeBytes === 0 ? 'yetki yok / yok' : '—'} ·{' '}
                  {fp.path}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </ScanContent>
    </ServerOpsModuleFrame>
  )
}

export function EnvironmentInspectorView({
  snapshot,
  isCollecting,
  onCollect,
}: ScanViewProps & { snapshot: EnvironmentInspectorSnapshot | null }) {
  const { t } = useLocale()

  return (
    <ServerOpsModuleFrame
      title={t('serverOps.envTitle')}
      subtitle={t('serverOps.envSubtitle')}
      isCollecting={isCollecting}
      hasSnapshot={Boolean(snapshot)}
      onCollect={onCollect}
      refreshLabel={t('serverOps.refreshScan')}
      startLabel={t('serverOps.startScan')}
    >
      <ScanContent
        isCollecting={isCollecting}
        snapshot={snapshot}
        emptyText={t('serverOps.envEmpty')}
        scanEmptyText={t('serverOps.envScanFailed')}
        noData={snapshot ? snapshot.scanStatus === 'failed' : false}
        warnings={snapshot?.scanStatus === 'failed' || snapshot?.scanStatus === 'partial' ? snapshot.warnings : []}
      >
        {snapshot ? (
          <>
            <p className="text-xs text-text-muted">{t('serverOps.envNoSecrets')}</p>
            {snapshot.scanStatus === 'empty' ? (
              <p className="rounded-lg border border-border bg-surface-muted/40 px-3 py-2 text-sm text-text-muted">
                {t('serverOps.envNoneFound')}
              </p>
            ) : null}
            {snapshot.files.map((file) => (
              <div key={file.path} className="min-w-0 rounded-lg border border-border p-2">
                <p className="truncate text-xs font-medium text-text" title={file.path}>
                  {file.path}
                </p>
                <p className="mt-1 truncate text-[11px] text-text-muted" title={file.keys.join(', ')}>
                  {file.keys.length > 0 ? file.keys.join(', ') : t('serverOps.envNoKeys')}
                </p>
              </div>
            ))}
            {snapshot.mismatches.slice(0, 8).map((row) => (
              <p key={row.key} className="truncate text-xs text-status-warning" title={row.key}>
                {row.key} — {t('serverOps.envMissingIn', { count: row.missingIn.length })}
              </p>
            ))}
          </>
        ) : null}
      </ScanContent>
    </ServerOpsModuleFrame>
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