import type { PublicServerProfile } from '@shared/contracts/profile'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type ProfileListItemProps = {
  profile: PublicServerProfile
  isLastConnected: boolean
  isSelected: boolean
  isConnecting: boolean
  connectDisabled: boolean
  onConnect: (profile: PublicServerProfile) => void
  onSftpConnect: (profile: PublicServerProfile) => void
  onEdit: (profile: PublicServerProfile) => void
  onDelete: (profile: PublicServerProfile) => void
}

function formatLastConnected(value: string | undefined, locale: 'tr' | 'en'): string | null {
  if (!value) {
    return null
  }

  return new Date(value).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function EditIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M11.5 2.1a1.2 1.2 0 0 1 1.7 1.7l-7.4 7.4-2.3.5.5-2.3 7.4-7.4ZM3 13.5h10v1H3v-1Z"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5.5 3V2.2A1.2 1.2 0 0 1 6.7 1h2.6a1.2 1.2 0 0 1 1.2 1.2V3H14v1.2H2V3h3.5Zm1.2-.3h2.6V3H6.7v-.3ZM4.3 5.5h7.4l-.5 7.7a1.2 1.2 0 0 1-1.2 1.1H6a1.2 1.2 0 0 1-1.2-1.1l-.5-7.7Z"
      />
    </svg>
  )
}

export function ProfileListItem({
  profile,
  isLastConnected,
  isSelected,
  isConnecting,
  connectDisabled,
  onConnect,
  onSftpConnect,
  onEdit,
  onDelete,
}: ProfileListItemProps) {
  const { locale, t } = useLocale()
  const lastConnectedLabel = formatLastConnected(profile.lastConnectedAt, locale)

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
          <p className="truncate text-sm font-medium text-text">{profile.name}</p>
          <p className="truncate text-xs text-text-muted">
            {profile.username}@{profile.host}:{profile.port}
          </p>
        </div>
        {isLastConnected ? (
          <span className="shrink-0 rounded-full bg-status-connected/20 px-2 py-0.5 text-[10px] font-medium text-status-connected">
            {t('profile.lastBadge')}
          </span>
        ) : null}
      </div>

      {lastConnectedLabel ? (
        <p className="mt-1 text-[11px] text-text-muted">
          {t('profile.lastConnected')}: {lastConnectedLabel}
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.25rem_2.25rem] items-stretch gap-2">
        <Button
          variant="primary"
          className="h-8 min-w-0 px-2 py-1 text-[11px]"
          disabled={connectDisabled || isConnecting}
          onClick={() => onConnect(profile)}
          aria-label={t('profile.connectTerminalAria', { name: profile.name })}
          aria-busy={isConnecting || undefined}
        >
          {t('profile.terminal')}
        </Button>
        <Button
          variant="success"
          className="h-8 min-w-0 px-2 py-1 text-[11px] font-semibold"
          disabled={connectDisabled}
          onClick={() => onSftpConnect(profile)}
          aria-label={t('profile.connectSftpAria', { name: profile.name })}
        >
          {t('profile.sftp')}
        </Button>
        <Button
          variant="secondary"
          className="h-8 w-9 shrink-0 p-0"
          disabled={connectDisabled}
          onClick={() => onEdit(profile)}
          aria-label={t('profile.editProfileAria', { name: profile.name })}
          title={t('profile.edit')}
        >
          <EditIcon />
        </Button>
        <Button
          variant="danger"
          className="h-8 w-9 shrink-0 p-0"
          disabled={connectDisabled}
          onClick={() => onDelete(profile)}
          aria-label={t('profile.deleteProfileAria', { name: profile.name })}
          title={t('profile.delete')}
        >
          <DeleteIcon />
        </Button>
      </div>
    </div>
  )
}