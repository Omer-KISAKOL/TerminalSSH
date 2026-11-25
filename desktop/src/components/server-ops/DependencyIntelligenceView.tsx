import { useMemo, useState } from 'react'

import type { DependencyIntelligenceSnapshot, DependencyNode } from '@shared/contracts/server-ops'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type DependencyIntelligenceViewProps = {
  snapshot: DependencyIntelligenceSnapshot | null
  isCollecting: boolean
  onCollect: () => void
}

const KIND_BADGE: Record<DependencyNode['kind'], string> = {
  service: 'bg-status-info/15 text-status-info',
  listener: 'bg-accent/15 text-accent',
  container: 'bg-status-success/15 text-status-success',
  proxy: 'bg-status-warning/15 text-status-warning',
}

export function DependencyIntelligenceView({
  snapshot,
  isCollecting,
  onCollect,
}: DependencyIntelligenceViewProps) {
  const { t, locale } = useLocale()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedNode = useMemo(
    () => snapshot?.nodes.find((node) => node.id === selectedId) ?? null,
    [selectedId, snapshot?.nodes],
  )

  const impacted = selectedId && snapshot ? snapshot.impactedByNodeId[selectedId] ?? [] : []

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text">{t('serverOps.dependencyTitle')}</h3>
          <p className="text-xs text-text-muted">{t('serverOps.dependencySubtitle')}</p>
        </div>
        <Button type="button" className="px-2.5 py-1.5 text-xs" disabled={isCollecting} onClick={onCollect}>
          {snapshot ? t('serverOps.refreshScan') : t('serverOps.startScan')}
        </Button>
      </div>

      {!snapshot ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-text-muted">
          {t('serverOps.dependencyEmpty')}
        </p>
      ) : (
        <>
          {snapshot.warnings.length > 0 ? (
            <ul className="space-y-1 rounded-lg border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-xs text-text-muted">
              {snapshot.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}

          {snapshot.nodes.length === 0 ? (
            <p className="text-sm text-text-muted">{t('serverOps.dependencyScanEmpty')}</p>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-surface-muted/40 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t('serverOps.dependencyGraph')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {snapshot.nodes.map((node) => {
                    const active = node.id === selectedId

                    return (
                      <button
                        key={node.id}
                        type="button"
                        className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                          active
                            ? 'border-accent bg-accent/10 text-text'
                            : 'border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text'
                        }`}
                        onClick={() => setSelectedId(active ? null : node.id)}
                      >
                        <span
                          className={`mr-1.5 inline-block rounded px-1 py-0.5 text-[10px] font-semibold uppercase ${KIND_BADGE[node.kind]}`}
                        >
                          {t(`serverOps.dependencyKind.${node.kind}`)}
                        </span>
                        <span className="font-medium text-text">{node.label}</span>
                        {node.detail ? (
                          <span className="mt-0.5 block truncate text-[10px] text-text-muted">
                            {node.detail}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>

              {snapshot.edges.length > 0 ? (
                <div className="rounded-lg border border-border px-3 py-2">
                  <p className="mb-2 text-xs font-medium text-text-muted">{t('serverOps.dependencyLinks')}</p>
                  <ul className="space-y-1.5 text-xs text-text">
                    {snapshot.edges.slice(0, 24).map((edge) => {
                      const from = snapshot.nodes.find((node) => node.id === edge.fromId)?.label ?? edge.fromId
                      const to = snapshot.nodes.find((node) => node.id === edge.toId)?.label ?? edge.toId

                      return (
                        <li key={edge.id} className="flex items-center gap-1.5 text-text-muted">
                          <span className="font-medium text-text">{from}</span>
                          <span aria-hidden>→</span>
                          <span className="font-medium text-text">{to}</span>
                          <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px]">
                            {edge.label}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              {selectedNode ? (
                <div className="rounded-lg border border-accent/30 bg-accent/5 px-3 py-3">
                  <p className="text-xs font-medium text-text-muted">{t('serverOps.dependencyImpactTitle')}</p>
                  <p className="mt-1 text-sm font-semibold text-text">{selectedNode.label}</p>
                  {impacted.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-0.5 pl-4 text-sm text-text">
                      {impacted.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-text-muted">{t('serverOps.dependencyImpactEmpty')}</p>
                  )}
                </div>
              ) : null}
            </>
          )}

          <p className="text-[11px] text-text-muted">
            {t('serverOps.collectedAt')}:{' '}
            {new Date(snapshot.collectedAt).toLocaleString(locale)}
          </p>
        </>
      )}
    </div>
  )
}