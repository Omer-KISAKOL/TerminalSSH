import type { AuthUser } from '@shared/contracts/auth'
import type { PublicServerProfile } from '@shared/contracts/profile'

import { AccountMenu } from '@/components/auth/AccountMenu'
import { ProfileList } from '@/components/profiles/ProfileList'
import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

import appIconUrl from '../../../resources/icons/icon.png?url'

type SidebarProps = {
  authUser: AuthUser | null
  onLogout: () => void
  onSyncProfiles: () => void
  syncingProfiles?: boolean
  profiles: PublicServerProfile[]
  selectedProfileId: string | null
  lastConnectedProfileId: string | null
  connectingProfileId: string | null
  connectDisabled: boolean
  profilesLoading: boolean
  profilesError: string | null
  isOpen: boolean
  onClose?: () => void
  onNewConnection: () => void
  onConnectProfile: (profile: PublicServerProfile) => void
  onSftpConnectProfile: (profile: PublicServerProfile) => void
  onEditProfile: (profile: PublicServerProfile) => void
  onDeleteProfile: (profile: PublicServerProfile) => void
  onOpenSettings: () => void
}

export function Sidebar({
  authUser,
  onLogout,
  onSyncProfiles,
  syncingProfiles = false,
  profiles,
  selectedProfileId,
  lastConnectedProfileId,
  connectingProfileId,
  connectDisabled,
  profilesLoading,
  profilesError,
  isOpen,
  onClose,
  onNewConnection,
  onConnectProfile,
  onSftpConnectProfile,
  onEditProfile,
  onDeleteProfile,
  onOpenSettings,
}: SidebarProps) {
  const { t } = useLocale()

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label={t('nav.closeSidebar')}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-72 shrink-0 flex-col border-r border-border bg-surface-raised transition-transform md:static md:z-auto md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label={t('nav.openSidebar')}
      >
        <header className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={appIconUrl}
              alt=""
              aria-hidden="true"
              className="h-12 w-12 shrink-0 rounded-xl border border-border"
            />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-text">
                TerminalSSH
              </h1>
              <p className="text-xs text-text-muted">{t('sidebar.tagline')}</p>
            </div>
          </div>
        </header>

        <div className="p-4">
          <Button
            variant="primary"
            className="w-full py-2.5"
            disabled={connectDisabled}
            onClick={onNewConnection}
            aria-label={t('sidebar.newConnectionAria')}
          >
            {t('sidebar.newConnection')}
          </Button>
        </div>

        <div className="px-4 pb-3">
          <Button variant="secondary" className="w-full py-2" onClick={onOpenSettings}>
            {t('sidebar.settings')}
          </Button>
        </div>

        <section className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            {t('sidebar.savedServers')}
          </h2>
          <ProfileList
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            lastConnectedProfileId={lastConnectedProfileId}
            connectingProfileId={connectingProfileId}
            connectDisabled={connectDisabled}
            isLoading={profilesLoading}
            error={profilesError}
            onConnect={onConnectProfile}
            onSftpConnect={onSftpConnectProfile}
            onEdit={onEditProfile}
            onDelete={onDeleteProfile}
          />
        </section>

        {authUser ? (
          <div className="mt-auto shrink-0 border-t border-border bg-surface-raised">
            <AccountMenu
              user={authUser}
              onLogout={onLogout}
              onSync={onSyncProfiles}
              syncing={syncingProfiles}
            />
          </div>
        ) : null}
      </aside>
    </>
  )
}
