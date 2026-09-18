import type { ConnectionStatus } from '@shared/contracts/ssh'

import { STATUS_COLORS } from '@/components/ui/StatusBadge'

export type ServerTab = {
  id: string
  label: string
  status: ConnectionStatus
  isActive: boolean
}

type ServerTabBarProps = {
  tabs: ServerTab[]
}

export function ServerTabBar({ tabs }: ServerTabBarProps) {
  if (tabs.length === 0) {
    return null
  }

  return (
    <div
      className="flex items-end gap-1 border-b border-border bg-surface-raised px-3 pt-2 md:px-4"
      role="tablist"
      aria-label="Sunucu sekmeleri"
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={tab.isActive}
          className={`flex max-w-xs items-center gap-2 rounded-t-lg border border-b-0 px-3 py-2 text-sm transition ${
            tab.isActive
              ? 'border-border bg-surface text-text'
              : 'border-transparent bg-transparent text-text-muted'
          }`}
        >
          <span
            className={`inline-block h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[tab.status]}`}
            aria-hidden="true"
          />
          <span className="truncate font-medium">{tab.label}</span>
        </div>
      ))}
    </div>
  )
}
