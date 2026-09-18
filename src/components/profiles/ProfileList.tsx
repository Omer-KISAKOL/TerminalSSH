import type { PublicServerProfile } from '@shared/contracts/profile'

import { ProfileListItem } from './ProfileListItem'

type ProfileListProps = {
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

export function ProfileList({
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
  if (isLoading) {
    return (
      <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-text-muted">
        Profiller yükleniyor…
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
        Henüz kayıtlı sunucu yok.
      </div>
    )
  }

  return (
    <div className="space-y-2 overflow-y-auto">
      {profiles.map((profile) => (
        <ProfileListItem
          key={profile.id}
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
