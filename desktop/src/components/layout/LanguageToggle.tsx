import type { AppLocale } from '@shared/i18n/locale'
import { APP_LOCALES } from '@shared/i18n/locale'

import { useLocale } from '@/hooks/useLocale'

const LABELS: Record<AppLocale, string> = {
  tr: 'TR',
  en: 'EN',
}

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale()

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-full border border-border bg-surface p-0.5"
      role="group"
      aria-label={t('settings.language')}
    >
      {APP_LOCALES.map((option) => {
        const selected = locale === option

        return (
          <button
            key={option}
            type="button"
            className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition ${
              selected
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
            aria-pressed={selected}
            onClick={() => setLocale(option)}
          >
            {LABELS[option]}
          </button>
        )
      })}
    </div>
  )
}