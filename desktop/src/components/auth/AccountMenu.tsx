import type { AuthUser } from '@shared/contracts/auth'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

type AccountMenuProps = {
  user: AuthUser
  onLogout: () => void
  onSync: () => void
  syncing?: boolean
}

function emailInitials(email: string): string {
  const local = email.split('@')[0] ?? email
  const letters = local.replace(/[^a-zA-Z0-9]/g, '')

  if (letters.length >= 2) {
    return letters.slice(0, 2).toUpperCase()
  }

  if (local.length >= 2) {
    return local.slice(0, 2).toUpperCase()
  }

  return local.slice(0, 1).toUpperCase() || '?'
}

function SyncIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" aria-hidden="true" fill="none">
      <path
        d="M10 3.5a6.5 6.5 0 0 1 6.2 4.5M16.5 10A6.5 6.5 0 0 1 4.8 14.5M10 16.5a6.5 6.5 0 0 1-6.2-4.5M3.5 10A6.5 6.5 0 0 1 15.2 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 3v3.5H12M4.5 17v-3.5H8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" aria-hidden="true" fill="none">
      <path
        d="M7.5 17H4.75A1.25 1.25 0 0 1 3.5 15.75V4.25A1.25 1.25 0 0 1 4.75 3h2.75M13 13.5 16.5 10 13 6.5M16.5 10H8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const accountActionButtonClass =
  'surface-hover-green h-8 w-full gap-1.5 border-border bg-transparent py-1.5 text-xs text-text shadow-none active:bg-surface-muted'

export function AccountMenu({ user, onLogout, onSync, syncing = false }: AccountMenuProps) {
  const { t } = useLocale()
  const initials = emailInitials(user.email)

  return (
    <div className="p-3">
      <div className="rounded-xl border border-border/90 bg-surface p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-xs font-semibold tracking-tight text-accent"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {t('account.label')}
            </p>
            <p className="mt-0.5 truncate text-sm font-medium leading-snug text-text" title={user.email}>
              {user.email}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <Button
            variant="secondary"
            className={accountActionButtonClass}
            loading={syncing}
            onClick={onSync}
          >
            {!syncing ? <SyncIcon /> : null}
            {syncing ? t('account.syncing') : t('account.sync')}
          </Button>
          <Button variant="secondary" className={accountActionButtonClass} onClick={onLogout}>
            <LogoutIcon />
            {t('account.logout')}
          </Button>
        </div>
      </div>
    </div>
  )
}