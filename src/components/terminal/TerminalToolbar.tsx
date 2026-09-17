import type { ConnectionStatus } from '@shared/contracts/ssh'

type TerminalToolbarProps = {
  serverLabel: string | null
  status: ConnectionStatus
  onReconnect: () => void
  onDisconnect: () => void
  onClear: () => void
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  idle: 'Bağlı değil',
  connecting: 'Bağlanıyor',
  connected: 'Bağlı',
  disconnecting: 'Bağlantı kesiliyor',
  disconnected: 'Bağlantı kesildi',
  error: 'Hata',
}

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  idle: 'bg-status-idle',
  connecting: 'bg-status-connecting',
  connected: 'bg-status-connected',
  disconnecting: 'bg-status-connecting',
  disconnected: 'bg-status-idle',
  error: 'bg-status-error',
}

export function TerminalToolbar({
  serverLabel,
  status,
  onReconnect,
  onDisconnect,
  onClear,
}: TerminalToolbarProps) {
  const canReconnect = status === 'disconnected' || status === 'error'
  const canDisconnect = status === 'connected' || status === 'connecting' || status === 'error'

  return (
    <header className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-medium text-white">{serverLabel ?? 'SSH Terminal'}</h2>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
          <span
            className={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[status]}`}
            aria-hidden="true"
          />
          {STATUS_LABELS[status]}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-text transition hover:bg-surface-muted"
        >
          Temizle
        </button>
        <button
          type="button"
          onClick={onReconnect}
          disabled={!canReconnect}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-text transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Yeniden Bağlan
        </button>
        <button
          type="button"
          onClick={onDisconnect}
          disabled={!canDisconnect}
          className="rounded-md border border-status-error/40 px-3 py-1.5 text-xs text-status-error transition hover:bg-status-error/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Bağlantıyı Kes
        </button>
      </div>
    </header>
  )
}
