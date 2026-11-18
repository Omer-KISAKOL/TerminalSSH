import type { WorkspaceTab } from '@shared/contracts/workspace'

import { useLocale } from '@/hooks/useLocale'
import { STATUS_COLORS } from '@/components/ui/StatusBadge'

type WorkspaceTabBarProps = {
  tabs: WorkspaceTab[]
  activeTabId: string | null
  onSelectTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
}

const tabActiveClass =
  'z-10 -mb-px min-h-10 rounded-t-xl border-2 border-accent/70 border-b-surface-muted border-t-4 border-t-accent bg-surface-muted px-4 py-2.5 text-text shadow-[0_-6px_16px_color-mix(in_srgb,var(--color-accent)_35%,transparent)]'

const tabInactiveClass =
  'rounded-t-lg border border-accent/35 border-b-transparent bg-accent/10 px-3 py-2 text-text-muted shadow-[inset_3px_0_0_var(--color-accent)] hover:border-accent/55 hover:bg-accent/15 hover:text-text'

export function WorkspaceTabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}: WorkspaceTabBarProps) {
  const { t } = useLocale()

  return (
    <div className="flex items-center gap-1 border-b-2 border-border bg-surface-raised px-2 pb-0 pt-2">
      <div
        className="tablist-scroll flex min-w-0 flex-1 items-end gap-1.5 overflow-x-auto"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const isSftp = tab.type === 'sftp'
          const tabSurfaceClass = isActive ? tabActiveClass : tabInactiveClass
          const badgeLabel = isSftp ? t('workspace.sftpBadge') : t('workspace.sshBadge')

          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={`group relative flex max-w-60 items-center gap-2 text-sm transition ${tabSurfaceClass}`}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => onSelectTab(tab.id)}
              >
                <span
                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[tab.status]}`}
                  aria-hidden="true"
                />
                <span className={`truncate ${isActive ? 'font-medium text-text' : ''}`}>
                  {tab.label}
                </span>
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'border border-accent/50 bg-accent/25 text-text'
                  }`}
                >
                  {badgeLabel}
                </span>
              </button>
              <button
                type="button"
                className={`rounded border border-transparent px-1 text-xs transition hover:border-border hover:bg-surface hover:text-text ${
                  isActive ? 'text-text opacity-100' : 'text-text-muted opacity-0 group-hover:opacity-100'
                }`}
                aria-label={t('workspace.closeTab', { label: tab.label })}
                onClick={() => onCloseTab(tab.id)}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}