import type { PublicServerProfile } from '@shared/contracts/profile'

type ProfileListItemProps = {
  profile: PublicServerProfile
  isLastConnected: boolean
  isSelected: boolean
  onSelect: (profile: PublicServerProfile) => void
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
  onSelect,
  onEdit,
  onDelete,
}: ProfileListItemProps) {
  const lastConnectedLabel = formatLastConnected(profile.lastConnectedAt)

  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        isSelected
          ? 'border-accent bg-accent/10'
          : 'border-border bg-surface hover:bg-surface-muted'
      }`}
    >
      <button type="button" onClick={() => onSelect(profile)} className="w-full text-left">
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
      </button>

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(profile)}
          className="rounded-md border border-border px-2 py-1 text-[11px] text-text-muted transition hover:bg-surface"
        >
          Düzenle
        </button>
        <button
          type="button"
          onClick={() => onDelete(profile)}
          className="rounded-md border border-status-error/30 px-2 py-1 text-[11px] text-status-error transition hover:bg-status-error/10"
        >
          Sil
        </button>
      </div>
    </div>
  )
}
