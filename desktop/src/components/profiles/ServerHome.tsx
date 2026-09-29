import type { PublicServerProfile } from '@shared/contracts/profile'

import { ProfileList } from '@/components/profiles/ProfileList'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

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
  onOpenSidebar: () => void
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
  onOpenSidebar,
}: ServerHomeProps) {
  const showEmpty = !profilesLoading && !profilesError && profiles.length === 0

  return (
    <>
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="px-2 py-1.5 md:hidden"
            onClick={onOpenSidebar}
            aria-label="Kenar çubuğunu aç"
          >
            ☰
          </Button>
          <div>
            <h2 className="text-base font-medium text-text">Kayıtlı Sunucular</h2>
            <p className="text-sm text-text-muted">Bağlanmak için bir sunucu seçin.</p>
          </div>
        </div>
        <Button variant="primary" disabled={connectDisabled} onClick={onNewConnection}>
          Yeni Bağlantı
        </Button>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-8">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
          {showEmpty ? (
            <EmptyState
              title="Henüz kayıtlı sunucu yok"
              description="Yeni bir bağlantı oluşturduğunuzda sunucu burada listelenir."
              icon={<span className="text-xl">&gt;_</span>}
              action={
                <Button variant="primary" disabled={connectDisabled} onClick={onNewConnection}>
                  Yeni Bağlantı
                </Button>
              }
            />
          ) : (
            <ProfileList
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
              Uygulama sürümü: <span className="font-mono text-text">{appVersion}</span>
            </p>
          ) : null}
        </div>
      </section>
    </>
  )
}
