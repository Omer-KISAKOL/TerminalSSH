import { useState } from 'react'

import { Button } from '@/components/ui/Button'

type ProfileExportSectionProps = {
  onChanged?: () => void
}

export function ProfileExportSection({ onChanged }: ProfileExportSectionProps) {
  const [busy, setBusy] = useState<'export' | 'import' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (includeSecrets: boolean) => {
    if (includeSecrets) {
      const confirmed = window.confirm(
        'Parola ve özel anahtarlar JSON dosyasına düz metin olarak yazılır. Devam etmek istiyor musunuz?',
      )
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

      setMessage(`${result.count} profil dışa aktarıldı: ${result.path}`)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Dışa aktarma başarısız.')
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

      setMessage(`${result.count} profil içe aktarıldı.`)
      onChanged?.()
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'İçe aktarma başarısız.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="border-b border-border px-5 py-4">
      <h3 className="text-sm font-medium text-text">Sunucu profilleri</h3>
      <p className="mt-1 text-xs text-text-muted">
        Kayıtlı sunucu bilgilerini JSON dosyası olarak dışa veya içe aktarın.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          loading={busy === 'export'}
          disabled={busy !== null}
          onClick={() => void handleExport(false)}
        >
          Dışa aktar (güvenli)
        </Button>
        <Button
          type="button"
          variant="secondary"
          loading={busy === 'export'}
          disabled={busy !== null}
          onClick={() => void handleExport(true)}
        >
          Dışa aktar (parolalı)
        </Button>
        <Button
          type="button"
          variant="primary"
          loading={busy === 'import'}
          disabled={busy !== null}
          onClick={() => void handleImport()}
        >
          İçe aktar
        </Button>
      </div>

      {message ? <p className="mt-3 text-sm text-text">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-status-error">{error}</p> : null}
    </section>
  )
}
