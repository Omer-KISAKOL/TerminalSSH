import { useCallback, useState } from 'react'

import type { AuthUser } from '@shared/contracts/auth'
import type { PublicServerProfile } from '@shared/contracts/profile'

import { AccountMenu } from '@/components/auth/AccountMenu'
import { ProfileList } from '@/components/profiles/ProfileList'
import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'
import { loadSidebarCollapsed, saveSidebarCollapsed } from '@/lib/sidebar-storage'

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
}

const WIDTH_EXPANDED = 'w-72'
const WIDTH_COLLAPSED_DESKTOP = 'w-72 md:w-[4.75rem]'

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
}: SidebarProps) {
  const { t } = useLocale()
  const [collapsed, setCollapsed] = useState(() => loadSidebarCollapsed())

  const setCollapsedPersisted = useCallback((next: boolean) => {
    setCollapsed(next)
    saveSidebarCollapsed(next)
  }, [])

  const widthClass = collapsed ? WIDTH_COLLAPSED_DESKTOP : WIDTH_EXPANDED

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
        className={`fixed inset-y-0 left-0 z-40 flex h-full shrink-0 flex-col border-r border-border bg-surface-raised transition-[width,transform] duration-200 md:static md:z-auto md:translate-x-0 ${widthClass} ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label={t('nav.openSidebar')}
        aria-expanded={!collapsed}
      >
        <header
          className={`titlebar-drag shrink-0 border-b border-border ${collapsed ? 'px-2 py-3' : 'px-5 py-4'}`}
        >
          <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-3'}`}>
            <img
              src={appIconUrl}
              alt=""
              aria-hidden="true"
              className={`shrink-0 rounded-xl border border-border ${
                collapsed ? 'h-9 w-9' : 'h-12 w-12'
              }`}
            />
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-semibold tracking-tight text-text">TerminalSSH</h1>
                <p className="text-xs text-text-muted">{t('sidebar.tagline')}</p>
              </div>
            ) : null}
            <button
              type="button"
              className={`titlebar-no-drag shrink-0 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-text-muted transition hover:bg-surface-muted hover:text-text ${
                collapsed ? 'w-full' : ''
              }`}
              aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
              onClick={() => setCollapsedPersisted(!collapsed)}
            >
              {collapsed ? '»' : '«'}
            </button>
          </div>
        </header>

        <div className={collapsed ? 'p-4 md:px-2 md:py-3' : 'p-4'}>
          {collapsed ? (
            <>
              <Button
                variant="primary"
                className="hidden h-10 w-full px-0 text-xl font-medium leading-none md:inline-flex md:items-center md:justify-center"
                disabled={connectDisabled}
                onClick={onNewConnection}
                aria-label={t('sidebar.newConnectionAria')}
                title={t('sidebar.newConnection')}
              >
                +
              </Button>
              <Button
                variant="primary"
                className="w-full py-2.5 md:hidden"
                disabled={connectDisabled}
                onClick={onNewConnection}
                aria-label={t('sidebar.newConnectionAria')}
              >
                {t('sidebar.newConnection')}
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              className="w-full py-2.5"
              disabled={connectDisabled}
              onClick={onNewConnection}
              aria-label={t('sidebar.newConnectionAria')}
            >
              {t('sidebar.newConnection')}
            </Button>
          )}
        </div>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-2 pt-1 md:px-4">
          <h2
            className={`mb-2 shrink-0 px-1 text-xs font-medium uppercase tracking-wide text-text-muted ${
              collapsed ? 'md:hidden' : ''
            }`}
          >
            {t('sidebar.savedServers')}
          </h2>

          {collapsed ? (
            <div className="hidden min-h-0 flex-1 flex-col gap-1 overflow-y-auto md:flex">
              {profilesLoading ? (
                <p className="px-1 text-center text-[10px] text-text-muted">…</p>
              ) : null}
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className={`flex h-9 w-full min-h-9 items-center justify-center rounded-lg border px-0.5 transition ${
                    selectedProfileId === profile.id
                      ? 'border-accent/60 bg-accent/15 text-text'
                      : 'border-border/60 bg-surface text-text hover:bg-surface-muted'
                  }`}
                  title={profile.name}
                  aria-label={t('sidebar.collapsedProfileAria', { name: profile.name })}
                  onClick={() => setCollapsedPersisted(false)}
                >
                  <span className="block max-w-full truncate text-center text-[10px] font-semibold leading-none tracking-tight whitespace-nowrap">
                    {profile.name}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <div
            className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain pr-0.5 ${collapsed ? 'md:hidden' : ''}`}
          >
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
          </div>
        </section>

        {authUser && !collapsed ? (
          <div className="mt-auto shrink-0 border-t border-border/80 bg-surface-muted/40">
            <AccountMenu
              user={authUser}
              onLogout={onLogout}
              onSync={onSyncProfiles}
              syncing={syncingProfiles}
            />
          </div>
        ) : null}

        {authUser && collapsed ? (
          <>
            <div className="mt-auto hidden shrink-0 border-t border-border p-2 md:block">
              <button
                type="button"
                className="flex h-9 w-full items-center justify-center rounded-lg border border-border text-xs font-bold text-text-muted hover:bg-surface-muted hover:text-text"
                aria-label={t('account.label')}
                title={authUser.email}
                onClick={() => setCollapsedPersisted(false)}
              >
                @
              </button>
            </div>
            <div className="mt-auto shrink-0 border-t border-border/80 bg-surface-muted/40 md:hidden">
              <AccountMenu
                user={authUser}
                onLogout={onLogout}
                onSync={onSyncProfiles}
                syncing={syncingProfiles}
              />
            </div>
          </>
        ) : null}
      </aside>
    </>
  )
}