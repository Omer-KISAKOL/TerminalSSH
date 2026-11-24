import { useCallback, useEffect, useRef } from 'react'

import type { PublicServerProfile } from '@shared/contracts/profile'
import type { ConnectionFormValues } from '@shared/contracts/ssh'
import type { TerminalWorkspaceTab } from '@shared/contracts/workspace'

import { ConnectionForm } from '@/components/connection/ConnectionForm'
import { TerminalHostPicker } from '@/components/terminal/TerminalHostPicker'
import { useLocale } from '@/hooks/useLocale'
import { TerminalCompanionPanel } from '@/components/workspace/TerminalCompanionPanel'
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
  connectionFormOpen?: boolean
  connectionFormMode?: 'create' | 'edit'
  connectionFormKey?: string
  connectionFormValues?: ConnectionFormValues
  connectionFormDisabled?: boolean
  onConnectionFormSubmit?: (values: ConnectionFormValues) => Promise<void>
  onCloseConnectionForm?: () => void
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
  connectionFormOpen = false,
  connectionFormMode = 'create',
  connectionFormKey,
  connectionFormValues,
  connectionFormDisabled = false,
  onConnectionFormSubmit,
  onCloseConnectionForm,
}: TerminalTabPanelProps) {
  const { t } = useLocale()
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
      if (!isActive) {
        return
      }

      onResize(tab.id, cols, rows)
    },
    [isActive, onResize, tab.id],
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

  const handlePasteCommand = (command: string) => {
    apiRef.current?.submit(command, { autoStart: false })
  }

  if (showHostPicker && connectionFormOpen && onConnectionFormSubmit) {
    return (
      <div className={isActive ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'hidden'}>
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
          <div>
            <h2 className="text-base font-medium text-text">
              {connectionFormMode === 'edit' ? t('profile.editProfileTitle') : t('connection.formTitleCreate')}
            </h2>
            <p className="text-sm text-text-muted">{t('connection.formSubtitle')}</p>
          </div>
          {onCloseConnectionForm ? (
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-xl leading-none text-text-muted transition hover:bg-surface-muted hover:text-text"
              aria-label={t('connection.closeForm')}
              onClick={onCloseConnectionForm}
            >
              ×
            </button>
          ) : null}
        </header>
        <section className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto w-full max-w-xl">
            <ConnectionForm
              key={connectionFormKey}
              mode={connectionFormMode}
              disabled={connectionFormDisabled}
              initialValues={connectionFormValues}
              onSubmit={onConnectionFormSubmit}
            />
          </div>
        </section>
      </div>
    )
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

  const terminalPanelClass = isActive
    ? 'relative z-10 flex min-h-0 min-w-0 flex-1'
    : 'pointer-events-none invisible absolute inset-0 z-0 flex min-h-0 min-w-0 flex-1'

  return (
    <div className={terminalPanelClass} aria-hidden={!isActive}>
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
        <TerminalView
          isActive={isActive}
          onReady={handleReady}
          onInput={handleInput}
          onResize={handleResize}
        />
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
      {showSnippets ? (
        <TerminalCompanionPanel
          sessionId={tab.sessionId}
          connected={tab.status === 'connected'}
          onApplySnippet={handleApplySnippet}
          onPasteCommand={handlePasteCommand}
        />
      ) : null}
    </div>
  )
}
