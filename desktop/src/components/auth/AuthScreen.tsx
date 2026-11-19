import type { ReactNode } from 'react'

import { useLocale } from '@/hooks/useLocale'

import appIconUrl from '../../../resources/icons/icon.png?url'

type AuthScreenProps = {
  children: ReactNode
}

export function AuthScreen({ children }: AuthScreenProps) {
  const { t } = useLocale()

  return (
    <div className="flex w-full max-w-104 flex-col items-stretch gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <img
          src={appIconUrl}
          alt=""
          aria-hidden="true"
          className="h-14 w-14 rounded-2xl border border-border/80 bg-surface-muted object-cover shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
        />
        <div className="space-y-0.5">
          <p className="text-lg font-semibold tracking-tight text-status-connected">TerminalSSH</p>
          <p className="text-xs text-white/65">{t('sidebar.tagline')}</p>
        </div>
      </header>

      {children}
    </div>
  )
}