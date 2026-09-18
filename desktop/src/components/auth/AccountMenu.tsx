import type { AuthUser } from '@shared/contracts/auth'

import { Button } from '@/components/ui/Button'

type AccountMenuProps = {
  user: AuthUser
  onLogout: () => void
  onSync: () => void
  syncing?: boolean
}

export function AccountMenu({ user, onLogout, onSync, syncing = false }: AccountMenuProps) {
  return (
    <div className="border-b border-border px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-text-muted">Hesap</p>
      <p className="truncate text-sm font-medium text-text">{user.email}</p>
      <div className="mt-2 flex gap-2">
        <Button variant="ghost" className="px-2 py-1 text-xs" loading={syncing} onClick={onSync}>
          Senkronize et
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onLogout}>
          Çıkış
        </Button>
      </div>
    </div>
  )
}
