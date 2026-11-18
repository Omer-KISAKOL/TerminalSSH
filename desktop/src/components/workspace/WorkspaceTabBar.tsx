import { useEffect, useRef, useState } from 'react'

import type { WorkspaceTab } from '@shared/contracts/workspace'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'
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
  const { t } = useLocale()
  const [menuOpen, setMenuOpen] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Node) || addMenuRef.current?.contains(target)) {
        return
      }

      setMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [menuOpen])

  return (
    <div className="flex items-center gap-1 border-b-2 border-border bg-surface-raised px-2 pb-0 pt-2">
      <div
        className="tablist-scroll flex min-w-0 flex-1 items-end gap-1.5 overflow-x-auto"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          const isSftp = tab.type === 'sftp'

          const tabSurfaceClass = isSftp
            ? isActive
              ? 'z-10 -mb-px min-h-10 rounded-t-xl border-2 border-accent/70 border-b-surface-muted border-t-4 border-t-accent bg-surface-muted px-4 py-2.5 text-text shadow-[0_-6px_16px_color-mix(in_srgb,var(--color-accent)_35%,transparent)]'
              : 'rounded-t-lg border border-accent/35 border-b-transparent bg-accent/10 px-3 py-2 text-text-muted shadow-[inset_3px_0_0_var(--color-accent)] hover:border-accent/55 hover:bg-accent/15 hover:text-text'
            : isActive
              ? 'z-10 -mb-px min-h-10 rounded-t-xl border-2 border-border border-b-surface-muted border-t-4 border-t-status-connected bg-surface-muted px-4 py-2.5 text-text shadow-[0_-4px_12px_rgba(0,0,0,0.35)]'
              : 'rounded-t-lg border border-border/50 border-b-transparent bg-surface/90 px-3 py-2 text-text-muted hover:border-border hover:bg-surface-muted/90 hover:text-text'

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
              <span className={`truncate ${isActive ? 'font-medium text-text' : ''}`}>{tab.label}</span>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isSftp
                    ? isActive
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'border border-accent/50 bg-accent/25 text-text'
                    : isActive
                      ? 'border border-status-connected/50 bg-status-connected/25 text-text'
                      : 'border border-border bg-surface text-text-muted'
                }`}
              >
                {isSftp ? t('workspace.sftpBadge') : t('workspace.sshBadge')}
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

      <div ref={addMenuRef} className="relative shrink-0">
        <Button
          variant="ghost"
          className="px-2 py-1 text-base leading-none"
          aria-label={t('workspace.addTab')}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen(true)}
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
              {t('nav.sshTerminal')}
            </button>
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-text hover:bg-surface-muted"
              onClick={() => {
                setMenuOpen(false)
                onAddSftpTab()
              }}
            >
              {t('nav.sftp')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
