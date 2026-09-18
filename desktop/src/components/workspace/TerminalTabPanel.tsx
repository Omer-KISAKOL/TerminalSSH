import { useCallback, useEffect, useRef } from 'react'

import type { TerminalWorkspaceTab } from '@shared/contracts/workspace'

import { TerminalStateOverlay } from '@/components/terminal/TerminalStateOverlay'
import { TerminalToolbar } from '@/components/terminal/TerminalToolbar'
import { TerminalView, type TerminalApi } from '@/components/terminal/TerminalView'

type TerminalTabPanelProps = {
  tab: TerminalWorkspaceTab
  isActive: boolean
  isBusy: boolean
  onReady: (tabId: string, api: TerminalApi | null) => void
  onInput: (tabId: string, data: string) => void
  onResize: (tabId: string, cols: number, rows: number) => void
  onReconnect: (tabId: string) => void
  onDisconnect: (tabId: string) => void
  onClear: (tabId: string) => void
  onBackToForm: () => void
  onOpenSidebar?: () => void
}

export function TerminalTabPanel({
  tab,
  isActive,
  isBusy,
  onReady,
  onInput,
  onResize,
  onReconnect,
  onDisconnect,
  onClear,
  onBackToForm,
  onOpenSidebar,
}: TerminalTabPanelProps) {
  const mountedRef = useRef(false)

  const handleReady = useCallback(
    (api: TerminalApi | null) => {
      onReady(tab.id, api)
    },
    [onReady, tab.id],
  )

  const handleInput = useCallback(
    (data: string) => {
      onInput(tab.id, data)
    },
    [onInput, tab.id],
  )

  const handleResize = useCallback(
    (cols: number, rows: number) => {
      onResize(tab.id, cols, rows)
    },
    [onResize, tab.id],
  )

  useEffect(() => {
    if (isActive && tab.status === 'connected' && mountedRef.current) {
      // focus handled by parent via terminal api map
    }
  }, [isActive, tab.status])

  useEffect(() => {
    mountedRef.current = true
  }, [])

  const showOverlay =
    tab.status === 'connecting' ||
    tab.status === 'disconnecting' ||
    tab.status === 'error' ||
    tab.status === 'disconnected'

  return (
    <div className={isActive ? 'relative flex min-h-0 flex-1 flex-col' : 'hidden'}>
      <TerminalToolbar
        serverLabel={tab.label}
        status={tab.status}
        isBusy={isBusy}
        onReconnect={() => onReconnect(tab.id)}
        onDisconnect={() => onDisconnect(tab.id)}
        onClear={() => onClear(tab.id)}
        onOpenSidebar={onOpenSidebar}
      />
      <TerminalView onReady={handleReady} onInput={handleInput} onResize={handleResize} />
      {showOverlay ? (
        <TerminalStateOverlay
          status={tab.status}
          errorMessage={tab.errorMessage}
          isReconnecting={isBusy}
          onReconnect={() => onReconnect(tab.id)}
          onBackToForm={onBackToForm}
        />
      ) : null}
    </div>
  )
}
