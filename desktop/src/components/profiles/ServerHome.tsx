import type { PublicServerProfile } from '@shared/contracts/profile'

import { ProfileList } from '@/components/profiles/ProfileList'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLocale } from '@/hooks/useLocale'

type ServerHomeProps = {
  appVersion: string | null
  profiles: PublicServerProfile[]
  selectedProfileId: string | null
  lastConnectedProfileId: string | null
  connectingProfileId: string | null
  connectDisabled: boolean
  profilesLoading: boolean
  profilesError: string | null
  onNewConnection: () => void
  onConnect: (profile: PublicServerProfile) => void
  onSftpConnect: (profile: PublicServerProfile) => void
  onEdit: (profile: PublicServerProfile) => void
  onDelete: (profile: PublicServerProfile) => void
}

export function ServerHome({
  appVersion,
  profiles,
  selectedProfileId,
  lastConnectedProfileId,
  connectingProfileId,
  connectDisabled,
  profilesLoading,
  profilesError,
  onNewConnection,
  onConnect,
  onSftpConnect,
  onEdit,
  onDelete,
}: ServerHomeProps) {
  const { t } = useLocale()
  const showEmpty = !profilesLoading && !profilesError && profiles.length === 0

  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
        <div>
          <h2 className="text-base font-medium text-text">{t('serverHome.title')}</h2>
          <p className="text-sm text-text-muted">{t('serverHome.subtitle')}</p>
        </div>
        <Button variant="primary" disabled={connectDisabled} onClick={onNewConnection}>
          {t('serverHome.newConnection')}
        </Button>
      </header>

      <section className="scroll-thin flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-8">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
          {showEmpty ? (
            <EmptyState
              title={t('serverHome.emptyTitle')}
              description={t('serverHome.emptyDescription')}
              icon={<span className="text-xl">&gt;_</span>}
              action={
                <Button variant="primary" disabled={connectDisabled} onClick={onNewConnection}>
                  {t('serverHome.newConnection')}
                </Button>
              }
            />
          ) : (
            <ProfileList
              columns={4}
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              lastConnectedProfileId={lastConnectedProfileId}
              connectingProfileId={connectingProfileId}
              connectDisabled={connectDisabled}
              isLoading={profilesLoading}
              error={profilesError}
              onConnect={onConnect}
              onSftpConnect={onSftpConnect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
          {appVersion ? (
            <p className="mt-6 text-center text-xs text-text-muted">
              {t('common.version')}: <span className="font-mono text-text">{appVersion}</span>
            </p>
          ) : null}
        </div>
      </section>
    </>
  )
}