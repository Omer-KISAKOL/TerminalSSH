import type { ReleaseCheckResponse } from '@shared/contracts/release'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type UpdateAvailableDialogProps = {
  update: ReleaseCheckResponse
  onInstall: () => void
  onDismiss: () => void
}

export function UpdateAvailableDialog({ update, onInstall, onDismiss }: UpdateAvailableDialogProps) {
  const { t } = useLocale()
  const native = update.nativeAutoUpdate === true
  const downloading = native && update.phase === 'downloading'
  const ready = native && update.phase === 'ready'
  const percent = update.percent ?? 0

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/55 p-4"
      role="presentation"
      onClick={ready ? undefined : onDismiss}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="update-dialog-title" className="text-lg font-semibold text-text">
          {t('update.title')}
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {native ? t('update.bodyNative') : t('update.body')}
        </p>
        <p className="mt-3 text-sm text-text">
          {t('update.versionLine', {
            current: update.currentVersion,
            latest: update.latestVersion ?? '—',
          })}
        </p>
        {downloading ? (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {t('update.downloading', { percent: Math.round(percent) })}
            </p>
          </div>
        ) : null}
        {update.releaseNotes ? (
          <p className="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-muted">
            {update.releaseNotes}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {ready ? null : (
            <Button type="button" variant="ghost" onClick={onDismiss} disabled={downloading}>
              {t('update.later')}
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={onInstall}
            disabled={downloading || (native && !ready)}
          >
            {ready ? t('update.restart') : downloading ? t('update.downloadingWait') : t('update.install')}
          </Button>
        </div>
      </div>
    </div>
  )
}