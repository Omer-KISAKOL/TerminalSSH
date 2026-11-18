import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

import { LanguageToggle } from './LanguageToggle'

type MainModeBarProps = {
  serversActive: boolean
  sftpActive: boolean
  onOpenSidebar: () => void
  onSelectServers: () => void
  onSelectSftp: () => void
  onNewConnection: () => void
  onAddTerminalTab: () => void
  onAddSftpTab: () => void
}

function ServersIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden="true">
      <rect x="2" y="3" width="12" height="3" rx="0.75" fill="currentColor" opacity="0.9" />
      <rect x="2" y="7.5" width="12" height="3" rx="0.75" fill="currentColor" opacity="0.65" />
      <rect x="2" y="12" width="12" height="1.5" rx="0.75" fill="currentColor" opacity="0.45" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="currentColor"
        d="M1.5 4.25A1.25 1.25 0 0 1 2.75 3h3.17l1.33 1.25h6A1.25 1.25 0 0 1 14.5 5.5v7.25A1.25 1.25 0 0 1 13.25 14H2.75A1.25 1.25 0 0 1 1.5 12.75V4.25Z"
        opacity="0.95"
      />
    </svg>
  )
}

function modePillClass(active: boolean): string {
  return `flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
    active
      ? 'border-border bg-surface-muted text-text shadow-sm'
      : 'border-transparent bg-surface/50 text-text-muted hover:border-border/60 hover:bg-surface-muted/70 hover:text-text'
  }`
}

export function MainModeBar({
  serversActive,
  sftpActive,
  onOpenSidebar,
  onSelectServers,
  onSelectSftp,
  onNewConnection,
  onAddTerminalTab,
  onAddSftpTab,
}: MainModeBarProps) {
  const { t } = useLocale()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Node) || menuRef.current?.contains(target)) {
        return
      }

      setMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [menuOpen])

  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-border bg-surface-raised px-2 py-2 md:px-3">
      <Button
        variant="ghost"
        className="px-2 py-1.5 md:hidden"
        onClick={onOpenSidebar}
        aria-label={t('nav.openSidebar')}
      >
        ☰
      </Button>

      <nav className="flex min-w-0 flex-1 items-center gap-1.5" aria-label={t('nav.servers')}>
        <button type="button" className={modePillClass(serversActive)} onClick={onSelectServers}>
          <ServersIcon />
          <span className="truncate">{t('nav.servers')}</span>
        </button>
        <button type="button" className={modePillClass(sftpActive)} onClick={onSelectSftp}>
          <FolderIcon />
          <span>{t('nav.sftp')}</span>
        </button>
      </nav>

      <LanguageToggle />

      <div ref={menuRef} className="relative shrink-0">
        <Button
          variant="ghost"
          className="px-2 py-1 text-lg leading-none text-text-muted"
          aria-label={t('nav.addNew')}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          +
        </Button>

        {menuOpen ? (
          <div
            className="absolute right-0 top-full z-30 mt-1 min-w-44 rounded-lg border border-border bg-surface-raised py-1 shadow-xl"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-sm text-text hover:bg-surface-muted"
              onClick={() => {
                setMenuOpen(false)
                onNewConnection()
              }}
            >
              {t('nav.newConnection')}
            </button>
            <button
              type="button"
              role="menuitem"
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
              role="menuitem"
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
    </header>
  )
}