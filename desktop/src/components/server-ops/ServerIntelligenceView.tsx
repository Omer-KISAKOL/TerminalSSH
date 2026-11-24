import type { ServerIntelligenceSnapshot } from '@shared/contracts/server-ops'

import { Button } from '@/components/ui/Button'
import { formatBytes } from '@/lib/format-bytes'
import { useLocale } from '@/hooks/useLocale'

function snapshotHasMetrics(snapshot: ServerIntelligenceSnapshot): boolean {
  return Boolean(
    snapshot.hostname ||
      snapshot.kernel ||
      snapshot.osName ||
      snapshot.uptime ||
      snapshot.memory?.totalBytes ||
      snapshot.memory?.summary ||
      snapshot.disks.length > 0,
  )
}

type ServerIntelligenceViewProps = {
  snapshot: ServerIntelligenceSnapshot | null
  isCollecting: boolean
  onCollect: () => void
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted/60 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-text">{value}</p>
    </div>
  )
}

export function ServerIntelligenceView({
  snapshot,
  isCollecting,
  onCollect,
}: ServerIntelligenceViewProps) {
  const { t, locale } = useLocale()

  const memoryUsed = (() => {
    if (!snapshot?.memory) {
      return '—'
    }

    if (snapshot.memory.totalBytes && snapshot.memory.usedBytes != null) {
      return `${formatBytes(snapshot.memory.usedBytes, locale)} / ${formatBytes(snapshot.memory.totalBytes, locale)}`
    }

    if (snapshot.memory.summary) {
      return snapshot.memory.summary
    }

    return '—'
  })()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text">{t('serverOps.intelligenceTitle')}</h3>
          <p className="text-xs text-text-muted">{t('serverOps.intelligenceSubtitle')}</p>
        </div>
        <Button variant="secondary" className="h-8 shrink-0 px-2.5 text-xs" loading={isCollecting} onClick={onCollect}>
          {snapshot ? t('serverOps.refreshScan') : t('serverOps.startScan')}
        </Button>
      </div>

      {!snapshot ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
          {t('serverOps.intelligenceEmpty')}
        </p>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {!snapshotHasMetrics(snapshot) ? (
            <p className="rounded-lg border border-status-error/40 bg-status-error/10 px-3 py-2 text-xs leading-relaxed text-status-error">
              {t('serverOps.intelligenceScanEmpty')}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <MetricCard label={t('serverOps.hostname')} value={snapshot.hostname ?? '—'} />
            <MetricCard
              label={t('serverOps.os')}
              value={
                snapshot.osName
                  ? [snapshot.osName, snapshot.osVersion].filter(Boolean).join(' ')
                  : '—'
              }
            />
            <MetricCard label={t('serverOps.kernel')} value={snapshot.kernel ?? '—'} />
            <MetricCard label={t('serverOps.memory')} value={memoryUsed} />
          </div>

          {snapshot.uptime ? (
            <section className="rounded-lg border border-border bg-surface/40 p-3">
              <p className="text-xs font-medium text-text-muted">{t('serverOps.uptime')}</p>
              <p className="mt-1 font-mono text-xs text-text">{snapshot.uptime}</p>
              {snapshot.loadAverage ? (
                <p className="mt-1 text-[11px] text-text-muted">
                  {t('serverOps.loadAverage')}: {snapshot.loadAverage}
                </p>
              ) : null}
            </section>
          ) : null}

          {snapshot.disks.length > 0 ? (
            <section>
              <p className="mb-2 text-xs font-medium text-text-muted">{t('serverOps.disks')}</p>
              <ul className="space-y-1.5">
                {snapshot.disks.map((disk) => (
                  <li
                    key={`${disk.mountpoint}-${disk.filesystem}`}
                    className="rounded-lg border border-border/80 bg-black/20 px-2.5 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-text">{disk.mountpoint}</span>
                      <span className="shrink-0 text-text-muted">{disk.usePercent}</span>
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-text-muted">
                      {disk.used} / {disk.size}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {snapshot.detectedTools.length > 0 ? (
            <section>
              <p className="mb-2 text-xs font-medium text-text-muted">{t('serverOps.detectedTools')}</p>
              <div className="flex flex-wrap gap-1.5">
                {snapshot.detectedTools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full border border-accent/35 bg-accent/10 px-2 py-0.5 text-[11px] text-text"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {snapshot.runningServices.length > 0 ? (
            <section>
              <p className="mb-2 text-xs font-medium text-text-muted">{t('serverOps.runningServices')}</p>
              <ul className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border/80 bg-black/15 p-2 font-mono text-[11px] text-text-muted">
                {snapshot.runningServices.map((service) => (
                  <li key={service} className="truncate">
                    {service}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {snapshot.warnings.length > 0 ? (
            <ul className="space-y-1 text-xs text-status-error">
              {snapshot.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          <p className="text-[11px] text-text-muted">
            {t('serverOps.collectedAt')}:{' '}
            {new Date(snapshot.collectedAt).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
          </p>
        </div>
      )}
    </div>
  )
}