import { SnippetPanel } from '@/components/snippets/SnippetPanel'
import { Button } from '@/components/ui/Button'

import { useLocale } from '@/hooks/useLocale'

import { AppearanceThemeSection } from './AppearanceThemeSection'
import { LanguageSection } from './LanguageSection'
import { ProfileExportSection } from './ProfileExportSection'

type SettingsDialogProps = {
  open: boolean
  onClose: () => void
  onProfilesChanged?: () => void
}

export function SettingsDialog({ open, onClose, onProfilesChanged }: SettingsDialogProps) {
  const { t } = useLocale()

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="settings-dialog-title" className="text-lg font-semibold text-text">
              {t('settings.title')}
            </h2>
            <p className="text-sm text-text-muted">{t('settings.subtitle')}</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.close')}
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <LanguageSection />
          <ProfileExportSection onChanged={onProfilesChanged} />

          <section className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-medium text-text">{t('settings.snippetsTitle')}</h3>
            <p className="mt-1 text-xs text-text-muted">{t('settings.snippetsHelp')}</p>
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              <SnippetPanel mode="settings" embedded />
            </div>
          </section>

          <AppearanceThemeSection />
        </div>
      </div>
    </div>
  )
}
