import { SnippetPanel } from '@/components/snippets/SnippetPanel'
import { Button } from '@/components/ui/Button'

import { ProfileExportSection } from './ProfileExportSection'

type SettingsDialogProps = {
  open: boolean
  onClose: () => void
  onProfilesChanged?: () => void
}

export function SettingsDialog({ open, onClose, onProfilesChanged }: SettingsDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text">Ayarlar</h2>
            <p className="text-sm text-text-muted">
              Sunucu profilleri ve snippet yönetimi.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Kapat
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <ProfileExportSection onChanged={onProfilesChanged} />

          <section className="px-5 py-4">
            <h3 className="text-sm font-medium text-text">Snippet'ler</h3>
            <p className="mt-1 text-xs text-text-muted">Tüm sunucularda paylaşılır.</p>
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <SnippetPanel mode="settings" embedded />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
