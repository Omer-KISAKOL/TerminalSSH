import type { ConnectionStatus } from '@shared/contracts/ssh'

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

type StatusBadgeProps = {
  status: ConnectionStatus
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 text-xs text-text-muted ${className}`}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${STATUS_COLORS[status]}`}
        aria-hidden="true"
      />
      {STATUS_LABELS[status]}
    </span>
  )
}

export { STATUS_LABELS, STATUS_COLORS }
