import type { PublicServerProfile } from '@shared/contracts/profile'

import { useLocale } from '@/hooks/useLocale'

import { ProfileListItem } from './ProfileListItem'

type ProfileListColumns = 1 | 2 | 4

type ProfileListProps = {
  columns?: ProfileListColumns
  profiles: PublicServerProfile[]
  selectedProfileId: string | null
  lastConnectedProfileId: string | null
  connectingProfileId: string | null
  connectDisabled: boolean
  isLoading: boolean
  error: string | null
  onConnect: (profile: PublicServerProfile) => void
  onSftpConnect: (profile: PublicServerProfile) => void
  onEdit: (profile: PublicServerProfile) => void
  onDelete: (profile: PublicServerProfile) => void
}

function profileListLayoutClass(columns: ProfileListColumns): string {
  if (columns === 4) {
    return 'grid grid-cols-2 gap-2 overflow-y-auto md:grid-cols-4'
  }

  if (columns === 2) {
    return 'grid grid-cols-2 gap-2 overflow-y-auto'
  }

  return 'space-y-2 overflow-y-auto'
}

export function ProfileList({
  columns = 1,
  profiles,
  selectedProfileId,
  lastConnectedProfileId,
  connectingProfileId,
  connectDisabled,
  isLoading,
  error,
  onConnect,
  onSftpConnect,
  onEdit,
  onDelete,
}: ProfileListProps) {
  const { t } = useLocale()

  if (isLoading) {
    return (
      <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
        {t('profile.loading')}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-status-error/30 px-3 py-4 text-sm text-status-error">
        {error}
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
        {t('profile.listEmpty')}
      </div>
    )
  }

  const dense = columns > 1

  return (
    <div className={profileListLayoutClass(columns)}>
      {profiles.map((profile) => (
        <ProfileListItem
          key={profile.id}
          dense={dense}
          profile={profile}
          isSelected={selectedProfileId === profile.id}
          isLastConnected={lastConnectedProfileId === profile.id}
          isConnecting={connectingProfileId === profile.id}
          connectDisabled={connectDisabled}
          onConnect={onConnect}
          onSftpConnect={onSftpConnect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}