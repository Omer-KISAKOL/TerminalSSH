import type { ProcessExplorerSnapshot, ProcessTreeNode } from '@shared/contracts/server-ops'

import { Button } from '@/components/ui/Button'
import { formatBytes } from '@/lib/format-bytes'
import { useLocale } from '@/hooks/useLocale'

type ProcessExplorerViewProps = {
  snapshot: ProcessExplorerSnapshot | null
  isCollecting: boolean
  onCollect: () => void
}

function ProcessRow({ node, depth }: { node: ProcessTreeNode; depth: number }) {
  const { locale } = useLocale()
  const rss = formatBytes(node.rssKb * 1024, locale)

  return (
    <>
      <tr className="border-b border-border/60 text-xs">
        <td className="py-1.5 pr-2 font-mono text-text-muted" style={{ paddingLeft: `${depth * 12 + 4}px` }}>
          {node.pid}
        </td>
        <td className="max-w-[8rem] truncate py-1.5 pr-2 font-medium text-text" title={node.command}>
          {node.command}
        </td>
        <td className="py-1.5 pr-2 text-right tabular-nums text-text">{node.cpuPercent.toFixed(1)}%</td>
        <td className="py-1.5 pr-2 text-right tabular-nums text-text-muted">{node.memPercent.toFixed(1)}%</td>
        <td className="py-1.5 text-right tabular-nums text-text-muted">{rss}</td>
      </tr>
      {node.children.map((child) => (
        <ProcessRow key={child.pid} node={child} depth={depth + 1} />
      ))}
    </>
  )
}

export function ProcessExplorerView({ snapshot, isCollecting, onCollect }: ProcessExplorerViewProps) {
  const { t, locale } = useLocale()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text">{t('serverOps.processTitle')}</h3>
          <p className="text-xs text-text-muted">{t('serverOps.processSubtitle')}</p>
        </div>
        <Button type="button" className="px-2.5 py-1.5 text-xs" disabled={isCollecting} onClick={onCollect}>
          {snapshot ? t('serverOps.refreshScan') : t('serverOps.startScan')}
        </Button>
      </div>

      {!snapshot ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-text-muted">
          {t('serverOps.processEmpty')}
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

          {snapshot.flatCount === 0 ? (
            <p className="text-sm text-text-muted">{t('serverOps.processScanEmpty')}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[20rem] border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-muted/50 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-1 py-2 text-left">{t('serverOps.processPid')}</th>
                    <th className="px-1 py-2 text-left">{t('serverOps.processName')}</th>
                    <th className="px-1 py-2 text-right">{t('serverOps.processCpu')}</th>
                    <th className="px-1 py-2 text-right">{t('serverOps.processMem')}</th>
                    <th className="px-1 py-2 text-right">{t('serverOps.processRss')}</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.roots.map((node) => (
                    <ProcessRow key={node.pid} node={node} depth={0} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-[11px] text-text-muted">
            {t('serverOps.processCount', { count: snapshot.flatCount })} · {t('serverOps.collectedAt')}:{' '}
            {new Date(snapshot.collectedAt).toLocaleString(locale)}
          </p>
        </>
      )}
    </div>
  )
}