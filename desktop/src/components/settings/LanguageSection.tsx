import type { AppLocale } from '@shared/i18n/locale'
import { APP_LOCALES } from '@shared/i18n/locale'

import { useLocale } from '@/hooks/useLocale'
import type { MessageKey } from '@/lib/i18n/catalog'

const LOCALE_LABEL_KEYS: Record<AppLocale, MessageKey> = {
  tr: 'settings.languageTr',
  en: 'settings.languageEn',
}

type LanguageSectionProps = {
  panelMode?: boolean
}

export function LanguageSection({ panelMode = false }: LanguageSectionProps) {
  const { locale, setLocale, t } = useLocale()

  const picker = (
    <div className={panelMode ? 'flex flex-wrap gap-2' : 'mt-3 flex flex-wrap gap-2'}>
        {APP_LOCALES.map((option) => {
          const selected = locale === option

          return (
            <button
              key={option}
              type="button"
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                selected
                  ? 'border-accent bg-accent/15 text-text'
                  : 'border-border bg-surface text-text-muted hover:border-text-muted/50 hover:text-text'
              }`}
              aria-pressed={selected}
              onClick={() => setLocale(option)}
            >
              {t(LOCALE_LABEL_KEYS[option])}
            </button>
          )
        })}
    </div>
  )

  if (panelMode) {
    return picker
  }

  return (
    <section className="border-b border-border px-5 py-4">
      <h3 className="text-sm font-medium text-text">{t('settings.language')}</h3>
      <p className="mt-1 text-xs text-text-muted">{t('settings.languageHelp')}</p>
      {picker}
    </section>
  )
}