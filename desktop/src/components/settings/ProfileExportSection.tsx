import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type ProfileExportSectionProps = {
  panelMode?: boolean
  onChanged?: () => void
}

export function ProfileExportSection({ panelMode = false, onChanged }: ProfileExportSectionProps) {
  const { t } = useLocale()
  const [busy, setBusy] = useState<'export' | 'import' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (includeSecrets: boolean) => {
    if (includeSecrets) {
      const confirmed = window.confirm(t('settings.exportSecretsConfirm'))
      if (!confirmed) return
    }

    setBusy('export')
    setError(null)
    setMessage(null)

    try {
      const result = await window.desktopApi.profiles.exportToFile({ includeSecrets })

      if (result.canceled) {
        return
      }

      setMessage(t('settings.exportSuccess', { count: result.count, path: result.path }))
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : t('settings.exportFailed'))
    } finally {
      setBusy(null)
    }
  }

  const handleImport = async () => {
    setBusy('import')
    setError(null)
    setMessage(null)

    try {
      const result = await window.desktopApi.profiles.importFromFile()

      if (result.canceled) {
        return
      }

      setMessage(t('settings.importSuccess', { count: result.count }))
      onChanged?.()
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : t('settings.importFailed'))
    } finally {
      setBusy(null)
    }
  }

  const actions = (
    <>
      <div className={panelMode ? 'flex flex-wrap gap-2' : 'mt-3 flex flex-wrap gap-2'}>
        <Button
          type="button"
          variant="secondary"
          loading={busy === 'export'}
          disabled={busy !== null}
          onClick={() => void handleExport(false)}
        >
          {t('settings.exportSafe')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          loading={busy === 'export'}
          disabled={busy !== null}
          onClick={() => void handleExport(true)}
        >
          {t('settings.exportSecrets')}
        </Button>
        <Button
          type="button"
          variant="primary"
          loading={busy === 'import'}
          disabled={busy !== null}
          onClick={() => void handleImport()}
        >
          {t('settings.import')}
        </Button>
      </div>

      {message ? <p className="mt-3 text-sm text-text">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-status-error">{error}</p> : null}
    </>
  )

  if (panelMode) {
    return actions
  }

  return (
    <section className="border-b border-border px-5 py-4">
      <h3 className="text-sm font-medium text-text">{t('settings.profilesTitle')}</h3>
      <p className="mt-1 text-xs text-text-muted">{t('settings.profilesHelp')}</p>
      {actions}
    </section>
  )
}