import type { PublicServerProfile } from '@shared/contracts/profile'

import { Button } from '@/components/ui/Button'

type ProfileListItemProps = {
  profile: PublicServerProfile
  isLastConnected: boolean
  isSelected: boolean
  isConnecting: boolean
  connectDisabled: boolean
  onConnect: (profile: PublicServerProfile) => void
  onEdit: (profile: PublicServerProfile) => void
  onDelete: (profile: PublicServerProfile) => void
}

function formatLastConnected(value?: string): string | null {
  if (!value) {
    return null
  }

  return new Date(value).toLocaleString('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export function ProfileListItem({
  profile,
  isLastConnected,
  isSelected,
  isConnecting,
  connectDisabled,
  onConnect,
  onEdit,
  onDelete,
}: ProfileListItemProps) {
  const lastConnectedLabel = formatLastConnected(profile.lastConnectedAt)

  return (
    <div
      className={`rounded-lg border px-3 py-2 transition ${
        isSelected
          ? 'border-accent bg-accent/10'
          : 'border-border bg-surface hover:bg-surface-muted'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{profile.name}</p>
          <p className="truncate text-xs text-text-muted">
            {profile.username}@{profile.host}:{profile.port}
          </p>
        </div>
        {isLastConnected ? (
          <span className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent">
            Son
          </span>
        ) : null}
      </div>

      {lastConnectedLabel ? (
        <p className="mt-1 text-[11px] text-text-muted">Son bağlantı: {lastConnectedLabel}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="primary"
          className="flex-1 px-2 py-1 text-[11px]"
          loading={isConnecting}
          disabled={connectDisabled}
          onClick={() => onConnect(profile)}
          aria-label={`${profile.name} sunucusuna bağlan`}
        >
          Bağlan
        </Button>
        <Button
          variant="ghost"
          className="px-2 py-1 text-[11px]"
          disabled={connectDisabled}
          onClick={() => onEdit(profile)}
          aria-label={`${profile.name} profilini düzenle`}
        >
          Düzenle
        </Button>
        <Button
          variant="danger"
          className="px-2 py-1 text-[11px]"
          disabled={connectDisabled}
          onClick={() => onDelete(profile)}
          aria-label={`${profile.name} profilini sil`}
        >
          Sil
        </Button>
      </div>
    </div>
  )
}
