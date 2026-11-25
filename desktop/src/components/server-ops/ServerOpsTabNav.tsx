import { useLocale } from '@/hooks/useLocale'

type ServerOpsTabNavProps<T extends string> = {
  tabs: T[]
  active: T
  labelKey: (tab: T) => string
  onChange: (tab: T) => void
}

export function ServerOpsTabNav<T extends string>({
  tabs,
  active,
  labelKey,
  onChange,
}: ServerOpsTabNavProps<T>) {
  const { t } = useLocale()

  if (tabs.length === 0) {
    return null
  }

  return (
    <nav className="shrink-0 border-b border-border" aria-label={t('serverOps.panelTitle')}>
      <div className="scroll-thin overflow-x-auto overscroll-x-contain">
        <div className="flex w-max min-w-full gap-1 px-2 py-2">
          {tabs.map((key) => {
            const label = labelKey(key)
            const isActive = active === key

            return (
              <button
                key={key}
                type="button"
                title={label}
                className={`max-w-[5.75rem] shrink-0 truncate rounded-lg border px-2.5 py-1.5 text-[11px] font-medium leading-tight transition ${
                  isActive
                    ? 'border-accent bg-accent/15 text-text shadow-[inset_0_0_0_1px_rgba(var(--color-accent-rgb),0.25)]'
                    : 'border-transparent text-text-muted hover:bg-surface-muted hover:text-text'
                }`}
                onClick={() => onChange(key)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}