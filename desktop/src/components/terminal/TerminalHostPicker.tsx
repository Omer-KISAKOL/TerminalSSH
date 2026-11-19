import type { PublicServerProfile } from '@shared/contracts/profile'

import { ProfileList } from '@/components/profiles/ProfileList'
import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type TerminalHostPickerProps = {
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

export function TerminalHostPicker({
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
}: TerminalHostPickerProps) {
  const { t } = useLocale()

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
        <div>
          <h2 className="text-base font-medium text-text">{t('serverHome.title')}</h2>
          <p className="text-sm text-text-muted">{t('serverHome.subtitle')}</p>
        </div>
        <Button variant="primary" disabled={connectDisabled} onClick={onNewConnection}>
          {t('serverHome.newConnection')}
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto w-full max-w-6xl">
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
        </div>
      </div>
    </section>
  )
}