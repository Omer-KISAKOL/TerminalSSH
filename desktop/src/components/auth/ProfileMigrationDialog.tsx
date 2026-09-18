import type { ProfileMigrationCandidate } from '@shared/contracts/profile'

import { Button } from '@/components/ui/Button'

type ProfileMigrationDialogProps = {
  profiles: ProfileMigrationCandidate[]
  loading: boolean
  onImport: () => void
  onSkip: () => void
}

export function ProfileMigrationDialog({
  profiles,
  loading,
  onImport,
  onSkip,
}: ProfileMigrationDialogProps) {
  if (profiles.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface-raised p-5 shadow-2xl">
        <h3 className="text-lg font-semibold text-text">Yerel profilleri buluta taşı</h3>
        <p className="mt-2 text-sm text-text-muted">
          Bu cihazda {profiles.length} kayıtlı sunucu bulundu. Hesabınıza aktarmak ister misiniz?
        </p>

        <ul className="mt-4 max-h-48 space-y-2 overflow-auto text-sm">
          {profiles.map((profile) => (
            <li key={profile.id} className="rounded-lg border border-border px-3 py-2">
              <div className="font-medium text-text">{profile.name}</div>
              <div className="text-text-muted">
                {profile.username}@{profile.host}:{profile.port}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onSkip} disabled={loading}>
            Atla
          </Button>
          <Button variant="primary" loading={loading} onClick={onImport}>
            Buluta aktar
          </Button>
        </div>
      </div>
    </div>
  )
}
