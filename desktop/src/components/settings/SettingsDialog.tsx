import { useEffect, useMemo, useState } from 'react'

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

type SettingsSectionId = 'language' | 'profiles' | 'snippets' | 'themes'

export function SettingsDialog({ open, onClose, onProfilesChanged }: SettingsDialogProps) {
  const { t } = useLocale()
  const [section, setSection] = useState<SettingsSectionId>('language')

  useEffect(() => {
    if (open) {
      setSection('language')
    }
  }, [open])

  const menuItems = useMemo(
    () =>
      [
        { id: 'language' as const, label: t('settings.language') },
        { id: 'profiles' as const, label: t('settings.profilesTitle') },
        { id: 'snippets' as const, label: t('settings.snippetsTitle') },
        { id: 'themes' as const, label: t('settings.themes') },
      ] satisfies { id: SettingsSectionId; label: string }[],
    [t],
  )

  const activeMeta = useMemo(() => {
    switch (section) {
      case 'language':
        return { title: t('settings.language'), help: t('settings.languageHelp') }
      case 'profiles':
        return { title: t('settings.profilesTitle'), help: t('settings.profilesHelp') }
      case 'snippets':
        return { title: t('settings.snippetsTitle'), help: t('settings.snippetsHelp') }
      case 'themes':
        return { title: t('settings.themes'), help: t('settings.themesHelpExpanded') }
    }
  }, [section, t])

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
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 id="settings-dialog-title" className="text-lg font-semibold text-text">
            {t('settings.title')}
          </h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.close')}
          </Button>
        </header>

        <div className="flex min-h-[min(32rem,70vh)] flex-1">
          <nav
            className="flex w-44 shrink-0 flex-col gap-0.5 border-r border-border bg-surface/50 p-2 sm:w-52"
            aria-label={t('settings.menuNav')}
          >
            {menuItems.map((item) => {
              const active = section === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? 'border border-border bg-surface-muted text-text shadow-sm'
                      : 'border border-transparent text-text-muted hover:bg-surface-muted/70 hover:text-text'
                  }`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setSection(item.id)}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold text-text">{activeMeta.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{activeMeta.help}</p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {section === 'language' ? <LanguageSection panelMode /> : null}
              {section === 'profiles' ? (
                <ProfileExportSection panelMode onChanged={onProfilesChanged} />
              ) : null}
              {section === 'snippets' ? (
                <div className="overflow-hidden rounded-lg border border-border">
                  <SnippetPanel mode="settings" embedded />
                </div>
              ) : null}
              {section === 'themes' ? <AppearanceThemeSection panelMode /> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}