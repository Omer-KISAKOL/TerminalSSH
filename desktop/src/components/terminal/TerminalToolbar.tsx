import type { ConnectionStatus } from '@shared/contracts/ssh'

import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useLocale } from '@/hooks/useLocale'

type TerminalToolbarProps = {
  serverLabel: string | null
  status: ConnectionStatus
  isBusy?: boolean
  onReconnect: () => void
  onDisconnect: () => void
  onClear: () => void
  onOpenSidebar?: () => void
}

const actionButtonClass = 'h-8 min-w-[4.5rem] px-2.5 py-0 text-xs font-medium'

export function TerminalToolbar({
  serverLabel,
  status,
  isBusy = false,
  onReconnect,
  onDisconnect,
  onClear,
  onOpenSidebar,
}: TerminalToolbarProps) {
  const { t } = useLocale()
  const canReconnect = status === 'disconnected' || status === 'error'
  const canDisconnect = status === 'connected' || status === 'connecting' || status === 'error'

  return (
    <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-raised px-3 md:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
        {onOpenSidebar ? (
          <Button
            variant="ghost"
            className="h-8 shrink-0 px-2 md:hidden"
            onClick={onOpenSidebar}
            aria-label={t('nav.openSidebar')}
          >
            ☰
          </Button>
        ) : null}
        <div className="flex min-w-0 items-center gap-2 md:gap-2.5">
          <h2
            className="truncate text-sm font-semibold leading-tight tracking-tight text-text"
            title={serverLabel ?? undefined}
          >
            {serverLabel ?? t('terminal.defaultTitle')}
          </h2>
          <span className="hidden h-3.5 w-px shrink-0 bg-border/80 sm:block" aria-hidden="true" />
          <StatusBadge status={status} className="shrink-0 whitespace-nowrap" />
        </div>
      </div>

      <div
        className="flex shrink-0 items-center gap-1 border-l border-transparent pl-0 md:gap-1.5 md:border-border/60 md:pl-2"
        role="group"
        aria-label={t('terminal.actionsGroup')}
      >
        <Button variant="ghost" className={actionButtonClass} onClick={onClear}>
          {t('terminal.clear')}
        </Button>
        <Button
          variant="secondary"
          className={`${actionButtonClass} hidden sm:inline-flex`}
          onClick={onReconnect}
          disabled={!canReconnect}
          loading={isBusy && canReconnect}
        >
          {t('terminal.reconnect')}
        </Button>
        <Button
          variant="danger"
          className={actionButtonClass}
          onClick={onDisconnect}
          disabled={!canDisconnect}
          loading={isBusy && status === 'disconnecting'}
        >
          {t('terminal.disconnect')}
        </Button>
      </div>
    </header>
  )
}