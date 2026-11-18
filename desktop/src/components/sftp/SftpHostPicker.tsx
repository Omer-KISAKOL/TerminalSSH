import type { PublicServerProfile } from '@shared/contracts/profile'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type SftpHostPickerProps = {
  profiles: PublicServerProfile[]
  loading: boolean
  disabled: boolean
  onConnectProfile: (profile: PublicServerProfile) => void
}

export function SftpHostPicker({
  profiles,
  loading,
  disabled,
  onConnectProfile,
}: SftpHostPickerProps) {
  const { t } = useLocale()

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col border border-border bg-surface-muted">
      <header className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-text">{t('sftp.pickServerTitle')}</h3>
        <p className="mt-1 text-xs text-text-muted">{t('sftp.pickServerHelp')}</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-text-muted">{t('profile.loading')}</p>
        ) : profiles.length === 0 ? (
          <p className="text-sm text-text-muted">{t('sftp.noProfiles')}</p>
        ) : (
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="rounded-lg border border-border bg-surface px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">{profile.name}</p>
                  <p className="truncate text-xs text-text-muted">
                    {profile.username}@{profile.host}:{profile.port}
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="mt-3 w-full py-1.5 text-xs"
                  disabled={disabled}
                  onClick={() => onConnectProfile(profile)}
                >
                  {t('sftp.connect')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}