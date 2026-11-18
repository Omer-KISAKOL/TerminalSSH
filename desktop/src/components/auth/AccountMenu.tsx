import type { AuthUser } from '@shared/contracts/auth'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type AccountMenuProps = {
  user: AuthUser
  onLogout: () => void
  onSync: () => void
  syncing?: boolean
}

export function AccountMenu({ user, onLogout, onSync, syncing = false }: AccountMenuProps) {
  const { t } = useLocale()

  return (
    <div className="px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-text-muted">{t('account.label')}</p>
      <p className="truncate text-sm font-medium text-text">{user.email}</p>
      <div className="mt-2 flex gap-2">
        <Button variant="ghost" className="px-2 py-1 text-xs" loading={syncing} onClick={onSync}>
          {syncing ? t('account.syncing') : t('account.sync')}
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onLogout}>
          {t('account.logout')}
        </Button>
      </div>
    </div>
  )
}