import { useState } from 'react'

import type { WorkspaceTab } from '@shared/contracts/workspace'

import { Button } from '@/components/ui/Button'
import { STATUS_COLORS } from '@/components/ui/StatusBadge'

type WorkspaceTabBarProps = {
  tabs: WorkspaceTab[]
  activeTabId: string | null
  onSelectTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onAddTerminalTab: () => void
  onAddSftpTab: () => void
}

export function WorkspaceTabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTerminalTab,
  onAddSftpTab,
}: WorkspaceTabBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex items-center gap-1 border-b border-border bg-surface-raised px-2 py-1.5">
      <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto" role="tablist">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tab"
            aria-selected={tab.id === activeTabId}
            className={`group flex max-w-[220px] items-center gap-2 rounded-t-lg border border-b-0 px-3 py-2 text-sm transition ${
              tab.id === activeTabId
                ? 'border-border bg-surface text-white'
                : 'border-transparent bg-transparent text-text-muted hover:bg-surface-muted/60'
            }`}
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
              <span className="truncate">{tab.label}</span>
              <span className="shrink-0 text-[10px] uppercase text-text-muted">
                {tab.type === 'sftp' ? 'SFTP' : 'SSH'}
              </span>
            </button>
            <button
              type="button"
              className="rounded px-1 text-xs text-text-muted opacity-0 transition hover:bg-surface-muted hover:text-white group-hover:opacity-100"
              aria-label={`${tab.label} sekmesini kapat`}
              onClick={() => onCloseTab(tab.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="relative shrink-0">
        <Button
          variant="ghost"
          className="px-2 py-1 text-base leading-none"
          aria-label="Yeni sekme ekle"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          +
        </Button>

        {menuOpen ? (
          <div className="absolute right-0 top-full z-20 mt-1 min-w-40 rounded-lg border border-border bg-surface-raised py-1 shadow-xl">
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-text hover:bg-surface-muted"
              onClick={() => {
                setMenuOpen(false)
                onAddTerminalTab()
              }}
            >
              SSH Terminal
            </button>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-text hover:bg-surface-muted"
              onClick={() => {
                setMenuOpen(false)
                onAddSftpTab()
              }}
            >
              SFTP
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
