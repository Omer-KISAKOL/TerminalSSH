import { useState } from 'react'

import { APPEARANCE_THEMES } from '@/lib/appearance-theme'
import { useAppearanceTheme } from '@/hooks/useAppearanceTheme'
import { useLocale } from '@/hooks/useLocale'

function ThemePreviewSwatch({
  background,
  bars,
  selected,
}: {
  background: string
  bars: [string, string, string]
  selected: boolean
}) {
  return (
    <div
      className={`flex h-8 w-13 shrink-0 flex-col justify-center gap-0.75 rounded-md border-2 p-1.5 ${
        selected ? 'border-[#3b82f6]' : 'border-transparent'
      }`}
      style={{ backgroundColor: background }}
      aria-hidden
    >
      {bars.map((color, index) => (
        <span
          key={`${color}-${index}`}
          className="block h-0.75 rounded-full"
          style={{ backgroundColor: color, width: index === 0 ? '100%' : index === 1 ? '85%' : '70%' }}
        />
      ))}
    </div>
  )
}

export function AppearanceThemeSection() {
  const { t } = useLocale()
  const { themeId, theme, setThemeId } = useAppearanceTheme()
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="px-5 py-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-3 text-left transition hover:bg-surface-muted"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
      >
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-text">{t('settings.themes')}</h3>
          <p className="mt-0.5 text-xs text-text-muted">
            {expanded
              ? t('settings.themesHelpExpanded')
              : t('settings.themesHelpCollapsed', { name: theme.name })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!expanded ? (
            <ThemePreviewSwatch
              background={theme.colors.terminalBackground}
              bars={theme.previewBars}
              selected={false}
            />
          ) : null}
          <span className="text-text-muted" aria-hidden="true">
            {expanded ? t('common.collapse') : t('common.expand')}
          </span>
        </div>
      </button>

      {expanded ? (
        <div className="mt-3 grid grid-cols-1 gap-0.5 sm:grid-cols-2">
          {APPEARANCE_THEMES.map((preset) => {
            const selected = themeId === preset.id

            return (
              <button
                key={preset.id}
                type="button"
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                  selected ? 'bg-surface-muted' : 'hover:bg-surface-muted/60'
                }`}
                aria-pressed={selected}
                onClick={() => setThemeId(preset.id)}
              >
                <ThemePreviewSwatch
                  background={preset.colors.terminalBackground}
                  bars={preset.previewBars}
                  selected={selected}
                />
                <span className="text-sm font-medium text-text">{preset.name}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}