import { useCallback, useEffect, useRef } from 'react'

import type { PublicServerProfile } from '@shared/contracts/profile'
import type { TerminalWorkspaceTab } from '@shared/contracts/workspace'

import { TerminalHostPicker } from '@/components/terminal/TerminalHostPicker'
import { SnippetPanel } from '@/components/snippets/SnippetPanel'
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
  profiles: PublicServerProfile[]
  selectedProfileId: string | null
  lastConnectedProfileId: string | null
  connectingProfileId: string | null
  connectDisabled: boolean
  profilesLoading: boolean
  profilesError: string | null
  onNewConnection: () => void
  onConnectProfile: (profile: PublicServerProfile) => void
  onSftpConnectProfile: (profile: PublicServerProfile) => void
  onEditProfile: (profile: PublicServerProfile) => void
  onDeleteProfile: (profile: PublicServerProfile) => void
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
  profiles,
  selectedProfileId,
  lastConnectedProfileId,
  connectingProfileId,
  connectDisabled,
  profilesLoading,
  profilesError,
  onNewConnection,
  onConnectProfile,
  onSftpConnectProfile,
  onEditProfile,
  onDeleteProfile,
}: TerminalTabPanelProps) {
  const mountedRef = useRef(false)
  const apiRef = useRef<TerminalApi | null>(null)

  const handleReady = useCallback(
    (api: TerminalApi | null) => {
      apiRef.current = api
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

  const showSnippets = tab.status === 'connected'
  const showHostPicker = tab.status === 'idle' && tab.sessionId === null

  const handleApplySnippet = (content: string, appendNewline: boolean) => {
    apiRef.current?.submit(appendNewline ? `${content}\n` : content, {
      autoStart: appendNewline,
    })
  }

  if (showHostPicker) {
    return (
      <div className={isActive ? 'flex min-h-0 flex-1 flex-col' : 'hidden'}>
        <TerminalHostPicker
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          lastConnectedProfileId={lastConnectedProfileId}
          connectingProfileId={connectingProfileId}
          connectDisabled={connectDisabled}
          profilesLoading={profilesLoading}
          profilesError={profilesError}
          onNewConnection={onNewConnection}
          onConnect={onConnectProfile}
          onSftpConnect={onSftpConnectProfile}
          onEdit={onEditProfile}
          onDelete={onDeleteProfile}
        />
      </div>
    )
  }

  return (
    <div className={isActive ? 'relative flex min-h-0 min-w-0 flex-1' : 'hidden'}>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
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
      {showSnippets ? <SnippetPanel mode="terminal" onApply={handleApplySnippet} /> : null}
    </div>
  )
}
