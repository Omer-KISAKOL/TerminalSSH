import { useState } from 'react'

import {
  validateAccountPasswordLocalized,
  validateEmailLocalized,
} from '@/lib/auth-validation'

import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useLocale } from '@/hooks/useLocale'

type LoginFormProps = {
  loading: boolean
  error: string | null
  onSubmit: (email: string, password: string) => Promise<void>
  onSwitchToRegister: () => void
  onContinueOffline: () => void
}

export function LoginForm({
  loading,
  error,
  onSubmit,
  onSwitchToRegister,
  onContinueOffline,
}: LoginFormProps) {
  const { t, messages } = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const emailError = validateEmailLocalized(email, messages.authValidation)
    const passwordError = validateAccountPasswordLocalized(password, messages.authValidation)

    if (emailError || passwordError) {
      setFormError(emailError ?? passwordError)
      return
    }

    setFormError(null)
    await onSubmit(email, password)
  }

  return (
    <form className="mx-auto flex w-full max-w-md flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <h2 className="text-xl font-semibold text-text">{t('auth.loginTitle')}</h2>
        <p className="mt-1 text-sm text-text-muted">{t('auth.loginSubtitle')}</p>
      </div>

      {error || formError ? (
        <p className="rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2 text-sm text-status-error">
          {formError ?? error}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text-muted">{t('auth.email')}</span>
        <input
          type="email"
          autoComplete="email"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-text"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text-muted">{t('auth.password')}</span>
        <PasswordInput
          autoComplete="current-password"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-text"
          value={password}
          onChange={setPassword}
        />
      </label>

      <Button type="submit" variant="primary" loading={loading}>
        {t('auth.login')}
      </Button>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" onClick={onSwitchToRegister}>
          {t('auth.register')}
        </Button>
        <Button type="button" variant="ghost" onClick={onContinueOffline}>
          {t('auth.offline')}
        </Button>
      </div>
    </form>
  )
}