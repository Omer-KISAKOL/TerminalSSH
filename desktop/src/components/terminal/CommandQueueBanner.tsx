import type { CommandQueueSnapshot } from '@/lib/command-queue'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type CommandQueueBannerProps = {
  snapshot: CommandQueueSnapshot
  onBegin: () => void
  onCancel: () => void
  onDropPending: () => void
}

export function CommandQueueBanner({
  snapshot,
  onBegin,
  onCancel,
  onDropPending,
}: CommandQueueBannerProps) {
  const { t } = useLocale()

  if (snapshot.phase === 'idle' || snapshot.lines.length === 0) {
    return null
  }

  const running = snapshot.phase === 'running'

  return (
    <div className="pointer-events-none absolute inset-x-3 top-3 z-20 md:inset-x-4">
      <div
        className="pointer-events-auto overflow-hidden rounded-lg border border-border bg-surface-raised/95 shadow-lg shadow-black/30 backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
          <p className="min-w-0 text-xs leading-relaxed text-text-muted">
            {running ? t('commandQueue.runningHint') : t('commandQueue.readyHint')}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {running ? (
              <Button variant="secondary" className="h-7 px-2.5 text-xs" onClick={onDropPending}>
                {t('commandQueue.dropQueue')}
              </Button>
            ) : (
              <>
                <Button variant="ghost" className="h-7 px-2.5 text-xs" onClick={onCancel}>
                  {t('commandQueue.cancel')}
                </Button>
                <Button variant="primary" className="h-7 px-2.5 text-xs" onClick={onBegin}>
                  {t('commandQueue.run')}
                </Button>
              </>
            )}
          </div>
        </div>
        <ol className="max-h-36 list-none overflow-y-auto px-3 py-2 font-mono text-xs leading-5">
          {snapshot.lines.map((line, index) => {
            const active = running && index === snapshot.activeIndex
            const done = running && index < snapshot.activeIndex

            return (
              <li
                key={`${index}-${line}`}
                className={`truncate py-0.5 ${active ? 'text-text' : 'text-text-muted'}`}
              >
                <span
                  className="mr-2 inline-block w-3 text-center text-[10px] tabular-nums"
                  aria-hidden="true"
                >
                  {done ? '✓' : active ? '›' : '·'}
                </span>
                <span className="align-middle">{line}</span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}