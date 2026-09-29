import type { CommandQueueSnapshot } from '@/lib/command-queue'

import { Button } from '@/components/ui/Button'

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
  if (snapshot.phase === 'idle' || snapshot.lines.length === 0) {
    return null
  }

  const running = snapshot.phase === 'running'

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-2">
      <div
        className="pointer-events-auto overflow-hidden rounded-lg border border-border bg-[#0f1117]/95 shadow-lg shadow-black/40"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
          <p className="text-xs text-text-muted">
            {running
              ? 'Komut çalışıyor. Bitince sıradaki gönderilecek.'
              : 'Komutlar hazır. Enter ile sırayla çalışır.'}
          </p>
          <div className="flex shrink-0 gap-2">
            {running ? (
              <Button className="px-2 py-1 text-xs" onClick={onDropPending}>
                Sırayı iptal et
              </Button>
            ) : (
              <>
                <Button className="px-2 py-1 text-xs" onClick={onCancel}>
                  İptal
                </Button>
                <Button variant="primary" className="px-2 py-1 text-xs" onClick={onBegin}>
                  Çalıştır
                </Button>
              </>
            )}
          </div>
        </div>
        <ol className="max-h-40 overflow-y-auto px-3 py-2 font-mono text-xs leading-5">
          {snapshot.lines.map((line, index) => {
            const active = running && index === snapshot.activeIndex
            const done = running && index < snapshot.activeIndex

            return (
              <li key={`${index}-${line}`} className={active ? 'text-text' : 'text-text-muted'}>
                <span className="mr-2 inline-block w-3 text-center text-[10px]">
                  {done ? '✓' : active ? '›' : '·'}
                </span>
                {line}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
