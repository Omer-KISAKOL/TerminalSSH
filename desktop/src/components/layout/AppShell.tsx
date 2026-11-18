import { useCallback, useEffect, useRef, useState } from 'react'

import type { PublicServerProfile } from '@shared/contracts/profile'
import type { ConnectionFormValues } from '@shared/contracts/ssh'

import { LoginForm } from '@/components/auth/LoginForm'
import { ProfileMigrationDialog } from '@/components/auth/ProfileMigrationDialog'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { ConnectionForm } from '@/components/connection/ConnectionForm'
import { HostFingerprintDialog } from '@/components/connection/HostFingerprintDialog'
import { ServerHome } from '@/components/profiles/ServerHome'
import { SftpTabPanel } from '@/components/sftp/SftpTabPanel'
import { TerminalTabPanel } from '@/components/workspace/TerminalTabPanel'
import { WorkspaceTabBar } from '@/components/workspace/WorkspaceTabBar'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/hooks/useLocale'
import { useHostVerification } from '@/hooks/useHostVerification'
import { useProfiles } from '@/hooks/useProfiles'
import { useWorkspaceTabs } from '@/hooks/useWorkspaceTabs'
import {
  DEFAULT_CONNECTION_FORM,
  publicProfileToFormValues,
  validateConnectionForm,
} from '@/lib/connection-form'
import { dismissMigrationPrompt, isMigrationPromptDismissed } from '@/lib/migration-prompt'

import { SettingsDialog } from '@/components/settings/SettingsDialog'

import { MainModeBar } from './MainModeBar'
import { Sidebar } from './Sidebar'

import type { TerminalApi } from '@/components/terminal/TerminalView'

type AppShellProps = {
  appVersion: string | null
}

type AuthScreen = 'login' | 'register'

export function AppShell({ appVersion }: AppShellProps) {
  const { t, messages } = useLocale()
  const auth = useAuth()
  const profiles = useProfiles()
  const terminalApisRef = useRef<Map<string, TerminalApi>>(new Map())
  const [view, setView] = useState<'servers' | 'form' | 'workspace'>('servers')
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [connectingProfileId, setConnectingProfileId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<ConnectionFormValues>(DEFAULT_CONNECTION_FORM)
  const [terminalSize, setTerminalSize] = useState({ cols: 80, rows: 24 })
  const [formKey, setFormKey] = useState('create')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login')
  const [offlineMode, setOfflineMode] = useState(false)
  const [migrationCandidates, setMigrationCandidates] = useState<
    Awaited<ReturnType<typeof window.desktopApi.profiles.listLocalOnly>>
  >([])
  const [showMigrationDialog, setShowMigrationDialog] = useState(false)
  const [migrationLoading, setMigrationLoading] = useState(false)
  const [syncingProfiles, setSyncingProfiles] = useState(false)
  const [migrationChecked, setMigrationChecked] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleTerminalData = useCallback((tabId: string, data: string) => {
    terminalApisRef.current.get(tabId)?.write(data)
  }, [])

  const handleTerminalMessage = useCallback((tabId: string, message: string) => {
    terminalApisRef.current.get(tabId)?.writeln(message)
  }, [])

  const workspace = useWorkspaceTabs({
    terminalSize,
    onTerminalData: handleTerminalData,
    onTerminalMessage: handleTerminalMessage,
  })
  const workspaceRef = useRef(workspace)
  workspaceRef.current = workspace

  useEffect(() => {
    const unsubscribeOpen = window.desktopApi.app.onOpenSftpTab(() => {
      void workspaceRef.current.addSftpTab()
      setView('workspace')
    })
    const unsubscribeFocus = window.desktopApi.app.onFocusSftpTab(() => {
      void workspaceRef.current.focusOrOpenSftpTab()
      setView('workspace')
    })

    return () => {
      unsubscribeOpen()
      unsubscribeFocus()
    }
  }, [])

  const hostVerification = useHostVerification()

  const resetForm = useCallback((mode: 'create' | 'edit', values: ConnectionFormValues) => {
    setFormMode(mode)
    setFormValues(values)
    setFormKey(`${mode}-${values.profileId ?? 'new'}-${Date.now()}`)
  }, [])

  const openProfile = useCallback(
    async (profile: PublicServerProfile) => {
      setSelectedProfileId(profile.id)

      let formValues = publicProfileToFormValues(profile)

      try {
        const secrets = await window.desktopApi.profiles.getEditSecrets(profile.id)
        formValues = publicProfileToFormValues(profile, secrets)
      } catch {
        // Sırlar okunamazsa profil alanları yine de açılır.
      }

      resetForm('edit', formValues)
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

      setConnectingProfileId(profileId ?? null)
      setView('workspace')

      try {
        await workspace.openTerminalSession(connectValues)
        await profiles.refresh()
      } finally {
        setConnectingProfileId(null)
      }
    },
    [formMode, profiles, resetForm, workspace],
  )

  const handleProfileConnect = useCallback(
    async (profile: PublicServerProfile) => {
      const values = publicProfileToFormValues(profile)
      const validationError = validateConnectionForm(values, messages.validation)

      if (validationError) {
        openProfile(profile)
        return
      }

      setSelectedProfileId(profile.id)
      setConnectingProfileId(profile.id)
      setView('workspace')

      try {
        await workspace.openTerminalSession(values)
        await profiles.refresh()
      } finally {
        setConnectingProfileId(null)
      }
    },
    [messages.validation, openProfile, profiles, workspace],
  )

  const handleProfileSftpConnect = useCallback(
    async (profile: PublicServerProfile) => {
      const values = publicProfileToFormValues(profile)
      const validationError = validateConnectionForm(values, messages.validation)

      if (validationError) {
        openProfile(profile)
        return
      }

      setSelectedProfileId(profile.id)
      setConnectingProfileId(profile.id)
      setView('workspace')

      try {
        await workspace.openSftpSession(values)
        await profiles.refresh()
      } finally {
        setConnectingProfileId(null)
      }
    },
    [messages.validation, openProfile, profiles, workspace],
  )

  useEffect(() => {
    if (workspace.activeTab?.type === 'terminal' && workspace.activeTab.status === 'connected') {
      terminalApisRef.current.get(workspace.activeTab.id)?.focus()
    }
  }, [workspace.activeTab])

  const handleNewConnection = useCallback(() => {
    setSelectedProfileId(null)
    resetForm('create', DEFAULT_CONNECTION_FORM)
    setView('form')
    setSidebarOpen(false)
  }, [resetForm])

  const handleProfileDelete = useCallback(
    async (profile: PublicServerProfile) => {
      const confirmed = window.confirm(t('profile.deleteConfirm', { name: profile.name }))

      if (!confirmed) {
        return
      }

      await profiles.remove(profile.id)

      if (selectedProfileId === profile.id) {
        setSelectedProfileId(null)
        resetForm('create', DEFAULT_CONNECTION_FORM)
        setView('servers')
      }
    },
    [profiles, resetForm, selectedProfileId, t],
  )

  const handleTerminalReady = useCallback((tabId: string, api: TerminalApi | null) => {
    if (api) {
      terminalApisRef.current.set(tabId, api)
      return
    }

    terminalApisRef.current.delete(tabId)
  }, [])

  const handleBackToServers = useCallback(() => {
    setView('servers')
  }, [])

  useEffect(() => {
    if (view !== 'form') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      if (settingsOpen || showMigrationDialog || hostVerification.pendingRequest) {
        return
      }

      event.preventDefault()
      handleBackToServers()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view, settingsOpen, showMigrationDialog, hostVerification.pendingRequest, handleBackToServers])

  const handleCloseTab = useCallback(
    async (tabId: string) => {
      const willBeEmpty = workspace.tabs.filter((tab) => tab.id !== tabId).length === 0
      await workspace.closeTab(tabId)
      terminalApisRef.current.delete(tabId)

      if (willBeEmpty) {
        setView('servers')
      }
    },
    [workspace],
  )

  const showWorkspace = view === 'workspace' && workspace.hasOpenTabs
  const isConnectBusy = workspace.isBusy || connectingProfileId !== null
  const serversModeActive =
    !settingsOpen && (view === 'servers' || view === 'form')
  const sftpModeActive =
    !settingsOpen && view === 'workspace' && workspace.activeTab?.type === 'sftp'
  const settingsModeActive = settingsOpen

  const handleSelectSftpMode = useCallback(() => {
    setSettingsOpen(false)
    void workspace.focusOrOpenSftpTab()
    setView('workspace')
  }, [workspace])

  const handleSelectServersMode = useCallback(() => {
    setSettingsOpen(false)
    handleBackToServers()
  }, [handleBackToServers])

  const handleSelectSettingsMode = useCallback(() => {
    setSettingsOpen(true)
  }, [])
  const showAuthGate = !auth.isLoading && !auth.isAuthenticated && !offlineMode

  useEffect(() => {
    if (auth.isAuthenticated && !auth.isLoading) {
      void profiles.refresh()
    }
  }, [auth.isAuthenticated, auth.isLoading, profiles.refresh])

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user || offlineMode || migrationChecked) {
      return
    }

    void (async () => {
      setMigrationChecked(true)

      if (isMigrationPromptDismissed(auth.user!.id)) {
        return
      }

      const localProfiles = await window.desktopApi.profiles.listLocalOnly()

      if (localProfiles.length > 0) {
        setMigrationCandidates(localProfiles)
        setShowMigrationDialog(true)
      }
    })()
  }, [auth.isAuthenticated, auth.user, migrationChecked, offlineMode])

  const handleImportLocalProfiles = useCallback(async () => {
    setMigrationLoading(true)

    try {
      await window.desktopApi.profiles.importLocal()
      await profiles.refresh()
      if (auth.user) {
        dismissMigrationPrompt(auth.user.id)
      }
      setShowMigrationDialog(false)
      setMigrationCandidates([])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('errors.migrationFailed')
      window.alert(message)
    } finally {
      setMigrationLoading(false)
    }
  }, [auth.user, profiles.refresh, t])

  const handleSkipMigration = useCallback(() => {
    if (auth.user) {
      dismissMigrationPrompt(auth.user.id)
    }
    setShowMigrationDialog(false)
    setMigrationCandidates([])
  }, [auth.user])

  const handleSyncProfiles = useCallback(async () => {
    setSyncingProfiles(true)

    try {
      await window.desktopApi.profiles.sync()
      await profiles.refresh()
    } finally {
      setSyncingProfiles(false)
    }
  }, [profiles.refresh])

  const handleLogout = useCallback(async () => {
    await auth.logout()
    setOfflineMode(false)
    await profiles.refresh()
  }, [auth, profiles.refresh])

  if (auth.isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-surface text-text-muted">
        {t('common.loading')}
      </div>
    )
  }

  if (showAuthGate) {
    return (
      <div className="flex h-full items-center justify-center bg-surface p-6">
        {authScreen === 'login' ? (
          <LoginForm
            loading={auth.isLoading}
            error={auth.error}
            onSubmit={async (email, password) => {
              await auth.login(email, password)
            }}
            onSwitchToRegister={() => setAuthScreen('register')}
            onContinueOffline={() => setOfflineMode(true)}
          />
        ) : (
          <RegisterForm
            loading={auth.isLoading}
            error={auth.error}
            onSubmit={async (email, password) => {
              await auth.register(email, password)
            }}
            onSwitchToLogin={() => setAuthScreen('login')}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 bg-surface">
      <Sidebar
        authUser={auth.user}
        onLogout={() => void handleLogout()}
        onSyncProfiles={() => void handleSyncProfiles()}
        syncingProfiles={syncingProfiles}
        profiles={profiles.profiles}
        selectedProfileId={selectedProfileId}
        lastConnectedProfileId={profiles.lastConnectedProfileId}
        connectingProfileId={connectingProfileId}
        connectDisabled={isConnectBusy}
        profilesLoading={profiles.isLoading}
        profilesError={profiles.error}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewConnection={handleNewConnection}
        onConnectProfile={(profile) => void handleProfileConnect(profile)}
        onSftpConnectProfile={(profile) => void handleProfileSftpConnect(profile)}
        onEditProfile={openProfile}
        onDeleteProfile={(profile) => void handleProfileDelete(profile)}
      />

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <MainModeBar
          serversActive={serversModeActive}
          sftpActive={sftpModeActive}
          settingsActive={settingsModeActive}
          onOpenSidebar={() => setSidebarOpen(true)}
          onSelectServers={handleSelectServersMode}
          onSelectSftp={handleSelectSftpMode}
          onSelectSettings={handleSelectSettingsMode}
          onNewConnection={handleNewConnection}
          onAddTerminalTab={() => {
            workspace.addTerminalTab()
            setView('workspace')
          }}
          onAddSftpTab={() => {
            void workspace.addSftpTab()
            setView('workspace')
          }}
        />

        {showWorkspace ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <WorkspaceTabBar
              tabs={workspace.tabs}
              activeTabId={workspace.activeTabId}
              onSelectTab={workspace.setActiveTabId}
              onCloseTab={(tabId) => void handleCloseTab(tabId)}
            />

            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {workspace.tabs.map((tab) =>
              tab.type === 'terminal' ? (
                <TerminalTabPanel
                  key={tab.id}
                  tab={tab}
                  isActive={tab.id === workspace.activeTabId}
                  isBusy={tab.status === 'connecting' || tab.status === 'disconnecting'}
                  onReady={handleTerminalReady}
                  onInput={(tabId, data) => void workspace.writeToTerminalTab(tabId, data)}
                  onResize={(tabId, cols, rows) => {
                    setTerminalSize({ cols, rows })
                    void workspace.resizeTerminalTab(tabId, cols, rows)
                  }}
                  onReconnect={(tabId) => void workspace.reconnectTab(tabId)}
                  onDisconnect={(tabId) => void workspace.disconnectTab(tabId)}
                  onClear={(tabId) => terminalApisRef.current.get(tabId)?.clear()}
                  onBackToForm={handleBackToServers}
                  onOpenSidebar={() => setSidebarOpen(true)}
                  profiles={profiles.profiles}
                  selectedProfileId={selectedProfileId}
                  lastConnectedProfileId={profiles.lastConnectedProfileId}
                  connectingProfileId={connectingProfileId}
                  connectDisabled={isConnectBusy}
                  profilesLoading={profiles.isLoading}
                  profilesError={profiles.error}
                  onNewConnection={handleNewConnection}
                  onConnectProfile={(profile) => void handleProfileConnect(profile)}
                  onSftpConnectProfile={(profile) => void handleProfileSftpConnect(profile)}
                  onEditProfile={openProfile}
                  onDeleteProfile={(profile) => void handleProfileDelete(profile)}
                />
              ) : (
                <SftpTabPanel
                  key={tab.id}
                  tab={tab}
                  isActive={tab.id === workspace.activeTabId}
                  profiles={profiles.profiles}
                  profilesLoading={profiles.isLoading}
                  connectDisabled={isConnectBusy}
                  onConnect={(values) => workspace.connectSftpTab(tab.id, values)}
                  onLocalPathChange={(path) => workspace.setSftpLocalPath(tab.id, path)}
                  onRemotePathChange={(path) => workspace.setSftpRemotePath(tab.id, path)}
                />
              ),
            )}
            </div>
          </div>
        ) : null}

        {!showWorkspace && view === 'form' ? (
          <>
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  className="px-2 py-1.5 md:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label={t('nav.openSidebar')}
                >
                  ☰
                </Button>
                <div>
                  <h2 className="text-base font-medium text-text">
                    {formMode === 'edit' ? t('profile.editProfileTitle') : t('connection.formTitleCreate')}
                  </h2>
                  <p className="text-sm text-text-muted">{t('connection.formSubtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleBackToServers}>
                  {t('connection.backToServers')}
                </Button>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-xl leading-none text-text-muted transition hover:bg-surface-muted hover:text-text"
                  aria-label={t('connection.closeForm')}
                  onClick={handleBackToServers}
                >
                  ×
                </button>
                <StatusBadge status="idle" />
              </div>
            </header>

            <section
              className="flex flex-1 flex-col overflow-y-auto p-4 md:p-8"
              role="presentation"
              onClick={handleBackToServers}
            >
              <div
                className="mx-auto w-full max-w-xl"
                role="presentation"
                onClick={(event) => event.stopPropagation()}
              >
                <ConnectionForm
                  key={formKey}
                  mode={formMode}
                  disabled={isConnectBusy}
                  initialValues={formValues}
                  onSubmit={handleConnect}
                />
                {appVersion ? (
                  <p className="mt-4 text-center text-xs text-text-muted">
                    {t('common.version')}: <span className="font-mono text-text">{appVersion}</span>
                  </p>
                ) : null}
              </div>
            </section>
          </>
        ) : null}

        {!showWorkspace && view !== 'form' ? (
          <ServerHome
            appVersion={appVersion}
            profiles={profiles.profiles}
            selectedProfileId={selectedProfileId}
            lastConnectedProfileId={profiles.lastConnectedProfileId}
            connectingProfileId={connectingProfileId}
            connectDisabled={isConnectBusy}
            profilesLoading={profiles.isLoading}
            profilesError={profiles.error}
            onNewConnection={handleNewConnection}
            onConnect={(profile) => void handleProfileConnect(profile)}
            onSftpConnect={(profile) => void handleProfileSftpConnect(profile)}
            onEdit={openProfile}
            onDelete={(profile) => void handleProfileDelete(profile)}
          />
        ) : null}
      </main>

      {showMigrationDialog ? (
        <ProfileMigrationDialog
          profiles={migrationCandidates}
          loading={migrationLoading}
          onImport={() => void handleImportLocalProfiles()}
          onSkip={handleSkipMigration}
        />
      ) : null}

      {settingsOpen ? (
        <SettingsDialog
          open
          onClose={() => setSettingsOpen(false)}
          onProfilesChanged={() => void profiles.refresh()}
        />
      ) : null}

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
