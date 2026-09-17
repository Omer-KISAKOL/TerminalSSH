import { useCallback, useEffect, useRef, useState } from 'react'

import type { PublicServerProfile } from '@shared/contracts/profile'
import type { ConnectionFormValues, ConnectionStatus } from '@shared/contracts/ssh'

import { ConnectionForm } from '@/components/connection/ConnectionForm'
import { HostFingerprintDialog } from '@/components/connection/HostFingerprintDialog'
import { TerminalStateOverlay } from '@/components/terminal/TerminalStateOverlay'
import { TerminalToolbar } from '@/components/terminal/TerminalToolbar'
import { TerminalView, type TerminalApi } from '@/components/terminal/TerminalView'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useHostVerification } from '@/hooks/useHostVerification'
import { useProfiles } from '@/hooks/useProfiles'
import { useSshSession } from '@/hooks/useSshSession'
import {
  DEFAULT_CONNECTION_FORM,
  getConnectionLabel,
  publicProfileToFormValues,
} from '@/lib/connection-form'

import { Sidebar } from './Sidebar'

type AppShellProps = {
  appVersion: string | null
}

export function AppShell({ appVersion }: AppShellProps) {
  const profiles = useProfiles()
  const terminalApiRef = useRef<TerminalApi | null>(null)
  const [view, setView] = useState<'form' | 'terminal'>('form')
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [terminalMounted, setTerminalMounted] = useState(false)
  const [formValues, setFormValues] = useState<ConnectionFormValues>(DEFAULT_CONNECTION_FORM)
  const [terminalSize, setTerminalSize] = useState({ cols: 80, rows: 24 })
  const [formKey, setFormKey] = useState('create')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)

  const handleTerminalReady = useCallback((api: TerminalApi | null) => {
    terminalApiRef.current = api
  }, [])

  const handleTerminalData = useCallback((data: string) => {
    terminalApiRef.current?.write(data)
  }, [])

  const handleTerminalMessage = useCallback((message: string) => {
    terminalApiRef.current?.writeln(message)
  }, [])

  const hostVerification = useHostVerification()

  const ssh = useSshSession({
    cols: terminalSize.cols,
    rows: terminalSize.rows,
    onData: handleTerminalData,
    onTerminalMessage: handleTerminalMessage,
  })

  const resetForm = useCallback((mode: 'create' | 'edit', values: ConnectionFormValues) => {
    setFormMode(mode)
    setFormValues(values)
    setFormKey(`${mode}-${values.profileId ?? 'new'}-${Date.now()}`)
  }, [])

  const openProfile = useCallback(
    (profile: PublicServerProfile) => {
      setSelectedProfileId(profile.id)
      resetForm('edit', publicProfileToFormValues(profile))
      setView('form')
      setSidebarOpen(false)
    },
    [resetForm],
  )

  const handleConnect = useCallback(
    async (values: ConnectionFormValues) => {
      let profileId = values.profileId

      if (values.saveProfile || formMode === 'edit') {
        const saved = await profiles.save({
          id: values.profileId,
          name: values.name.trim(),
          host: values.host.trim(),
          port: Number.parseInt(values.port, 10),
          username: values.username.trim(),
          authType: values.authType,
          privateKeyPath: values.authType === 'privateKey' ? values.privateKeyPath : undefined,
          savePassword: values.savePassword,
          savePassphrase: values.savePassphrase,
          password: values.password || undefined,
          passphrase: values.passphrase || undefined,
        })

        profileId = saved.id
        setSelectedProfileId(saved.id)
        resetForm('edit', publicProfileToFormValues(saved))
      }

      const connectValues: ConnectionFormValues = {
        ...values,
        profileId,
      }

      setFormValues(connectValues)
      setTerminalMounted(true)
      setView('terminal')
      setSidebarOpen(false)

      const label = getConnectionLabel(connectValues)
      await ssh.connect(connectValues, label)
      await profiles.refresh()
    },
    [formMode, profiles, resetForm, ssh],
  )

  useEffect(() => {
    if (ssh.status === 'connected') {
      terminalApiRef.current?.focus()
      setIsReconnecting(false)
    }
  }, [ssh.status])

  const handleNewConnection = useCallback(async () => {
    await ssh.disconnect()
    ssh.reset()
    setSelectedProfileId(null)
    resetForm('create', DEFAULT_CONNECTION_FORM)
    setView('form')
    setSidebarOpen(false)
  }, [resetForm, ssh])

  const handleProfileSelect = useCallback(
    (profile: PublicServerProfile) => {
      void ssh.disconnect()
      ssh.reset()
      openProfile(profile)
    },
    [openProfile, ssh],
  )

  const handleProfileDelete = useCallback(
    async (profile: PublicServerProfile) => {
      const confirmed = window.confirm(
        `"${profile.name}" profilini silmek istediğinize emin misiniz?`,
      )

      if (!confirmed) {
        return
      }

      await profiles.remove(profile.id)

      if (selectedProfileId === profile.id) {
        setSelectedProfileId(null)
        resetForm('create', DEFAULT_CONNECTION_FORM)
        setView('form')
      }
    },
    [profiles, resetForm, selectedProfileId],
  )

  const handleReconnect = useCallback(async () => {
    setIsReconnecting(true)

    try {
      await ssh.reconnect()
      terminalApiRef.current?.focus()
    } finally {
      setIsReconnecting(false)
    }
  }, [ssh])

  const handleDisconnect = useCallback(async () => {
    await ssh.disconnect()
  }, [ssh])

  const handleClear = useCallback(() => {
    terminalApiRef.current?.clear()
  }, [])

  const handleResize = useCallback(
    (cols: number, rows: number) => {
      setTerminalSize({ cols, rows })
      void ssh.resize(cols, rows)
    },
    [ssh],
  )

  const handleInput = useCallback(
    (data: string) => {
      void ssh.write(data)
    },
    [ssh],
  )

  const handleBackToForm = useCallback(async () => {
    await ssh.disconnect()
    ssh.reset()
    setView('form')
  }, [ssh])

  const showTerminal = view === 'terminal'
  const status: ConnectionStatus = showTerminal ? ssh.status : 'idle'
  const showTerminalOverlay =
    showTerminal &&
    (status === 'connecting' ||
      status === 'disconnecting' ||
      status === 'error' ||
      status === 'disconnected')

  return (
    <div className="flex h-full min-h-0 bg-surface">
      <Sidebar
        profiles={profiles.profiles}
        selectedProfileId={selectedProfileId}
        lastConnectedProfileId={profiles.lastConnectedProfileId}
        profilesLoading={profiles.isLoading}
        profilesError={profiles.error}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewConnection={() => void handleNewConnection()}
        onSelectProfile={handleProfileSelect}
        onEditProfile={handleProfileSelect}
        onDeleteProfile={(profile) => void handleProfileDelete(profile)}
      />

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {terminalMounted ? (
          <div
            className={
              showTerminal
                ? 'relative flex min-h-0 flex-1 flex-col'
                : 'pointer-events-none invisible absolute inset-0 flex min-h-0 flex-col'
            }
          >
            <TerminalToolbar
              serverLabel={ssh.serverLabel}
              status={status}
              isBusy={ssh.isBusy || isReconnecting}
              onReconnect={() => void handleReconnect()}
              onDisconnect={() => void handleDisconnect()}
              onClear={handleClear}
              onOpenSidebar={() => setSidebarOpen(true)}
            />
            <TerminalView
              onReady={handleTerminalReady}
              onInput={handleInput}
              onResize={handleResize}
            />
            {showTerminalOverlay ? (
              <TerminalStateOverlay
                status={status}
                errorMessage={ssh.errorMessage}
                isReconnecting={isReconnecting}
                onReconnect={() => void handleReconnect()}
                onBackToForm={() => void handleBackToForm()}
              />
            ) : null}
          </div>
        ) : null}

        {!showTerminal ? (
          <>
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  className="px-2 py-1.5 md:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Kenar çubuğunu aç"
                >
                  ☰
                </Button>
                <div>
                  <h2 className="text-base font-medium text-white">
                    {formMode === 'edit' ? 'Profili Düzenle' : 'Bağlantı'}
                  </h2>
                  <p className="text-sm text-text-muted">
                    SSH oturumu başlatmak için bağlantı bilgilerini girin.
                  </p>
                </div>
              </div>
              <StatusBadge status="idle" />
            </header>

            <section className="flex flex-1 flex-col overflow-y-auto p-4 md:p-8">
              {profiles.profiles.length === 0 && formMode === 'create' ? (
                <EmptyState
                  title="Hoş geldiniz"
                  description="Henüz kayıtlı sunucu yok. Aşağıdaki formu kullanarak ilk SSH bağlantınızı kurabilir veya profil olarak kaydedebilirsiniz."
                  icon={<span className="text-xl">&gt;_</span>}
                />
              ) : null}

              <div className="mx-auto w-full max-w-xl">
                <ConnectionForm
                  key={formKey}
                  mode={formMode}
                  disabled={ssh.isBusy}
                  initialValues={formValues}
                  onSubmit={handleConnect}
                />
                {appVersion ? (
                  <p className="mt-4 text-center text-xs text-text-muted">
                    Uygulama sürümü: <span className="font-mono text-text">{appVersion}</span>
                  </p>
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </main>

      {hostVerification.pendingRequest ? (
        <HostFingerprintDialog
          request={hostVerification.pendingRequest}
          isResponding={hostVerification.isResponding}
          onApprove={() => void hostVerification.approve()}
          onReject={() => void hostVerification.reject()}
          onDismiss={hostVerification.dismiss}
        />
      ) : null}
    </div>
  )
}
