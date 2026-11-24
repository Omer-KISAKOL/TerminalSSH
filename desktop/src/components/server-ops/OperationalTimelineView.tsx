import type { OperationalTimelineEvent } from '@shared/contracts/server-ops'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type OperationalTimelineViewProps = {
  events: OperationalTimelineEvent[]
  retentionDays: number
  isLoading: boolean
  onRefresh: () => void
}

const typeBadgeClass: Record<OperationalTimelineEvent['type'], string> = {
  connect: 'border-status-connected/40 bg-status-connected/10 text-status-connected',
  disconnect: 'border-text-muted/35 bg-surface-muted text-text-muted',
  command: 'border-accent/35 bg-accent/10 text-text',
  intelligence: 'border-accent/35 bg-accent/10 text-accent',
  suggestion: 'border-white/20 bg-white/5 text-text',
}

export function OperationalTimelineView({
  events,
  retentionDays,
  isLoading,
  onRefresh,
}: OperationalTimelineViewProps) {
  const { t, locale } = useLocale()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text">{t('serverOps.timelineTitle')}</h3>
          <p className="text-xs text-text-muted">
            {t('serverOps.timelineSubtitle')}
          </p>
        </div>
        <Button variant="ghost" className="h-8 px-2 text-xs" onClick={onRefresh} loading={isLoading}>
          {t('serverOps.timelineRefresh')}
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
          {t('serverOps.timelineEmpty')}
        </p>
      ) : (
        <ol className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-border/80 bg-surface/50 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-text">{event.summary}</p>
                <span
                  className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${typeBadgeClass[event.type]}`}
                >
                  {t(`serverOps.timelineType.${event.type}`)}
                </span>
              </div>
              {event.detail ? (
                <pre className="mt-2 max-h-24 overflow-auto rounded border border-border/70 bg-black/20 p-2 font-mono text-[11px] text-text-muted">
                  {event.detail}
                </pre>
              ) : null}
              <p className="mt-1.5 text-[11px] text-text-muted">
                {new Date(event.createdAt).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}