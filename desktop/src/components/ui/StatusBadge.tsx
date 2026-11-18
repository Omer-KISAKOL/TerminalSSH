import type { ConnectionStatus } from '@shared/contracts/ssh'

import { useLocale } from '@/hooks/useLocale'

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
  const { t } = useLocale()

  const label =
    status === 'idle'
      ? t('status.notConnected')
      : status === 'connecting'
        ? t('status.connecting')
        : status === 'connected'
          ? t('status.connected')
          : status === 'disconnecting'
            ? t('status.disconnecting')
            : status === 'disconnected'
              ? t('status.disconnected')
              : t('status.error')

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
      {label}
    </span>
  )
}

export { STATUS_COLORS }