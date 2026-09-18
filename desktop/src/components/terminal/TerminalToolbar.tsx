import type { ConnectionStatus } from '@shared/contracts/ssh'

import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'

type TerminalToolbarProps = {
  serverLabel: string | null
  status: ConnectionStatus
  isBusy?: boolean
  onReconnect: () => void
  onDisconnect: () => void
  onClear: () => void
  onOpenSidebar?: () => void
}

export function TerminalToolbar({
  serverLabel,
  status,
  isBusy = false,
  onReconnect,
  onDisconnect,
  onClear,
  onOpenSidebar,
}: TerminalToolbarProps) {
  const canReconnect = status === 'disconnected' || status === 'error'
  const canDisconnect = status === 'connected' || status === 'connecting' || status === 'error'

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-3 py-3 md:px-4">
      <div className="flex min-w-0 items-center gap-3">
        {onOpenSidebar ? (
          <Button
            variant="ghost"
            className="px-2 py-1.5 md:hidden"
            onClick={onOpenSidebar}
            aria-label="Kenar çubuğunu aç"
          >
            ☰
          </Button>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium text-text">{serverLabel ?? 'SSH Terminal'}</h2>
          <StatusBadge status={status} className="mt-1" />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={onClear}>
          Temizle
        </Button>
        <Button
          variant="secondary"
          className="hidden px-2.5 py-1.5 text-xs sm:inline-flex"
          onClick={onReconnect}
          disabled={!canReconnect}
          loading={isBusy && canReconnect}
        >
          Yeniden Bağlan
        </Button>
        <Button
          variant="danger"
          className="px-2.5 py-1.5 text-xs"
          onClick={onDisconnect}
          disabled={!canDisconnect}
          loading={isBusy && status === 'disconnecting'}
        >
          Bağlantıyı Kes
        </Button>
      </div>
    </header>
  )
}
