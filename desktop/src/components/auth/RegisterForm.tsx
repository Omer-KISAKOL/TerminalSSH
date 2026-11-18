import { useState } from 'react'

import {
  validateAccountPasswordLocalized,
  validateEmailLocalized,
} from '@/lib/auth-validation'

import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useLocale } from '@/hooks/useLocale'

type RegisterFormProps = {
  loading: boolean
  error: string | null
  onSubmit: (email: string, password: string) => Promise<void>
  onSwitchToLogin: () => void
}

export function RegisterForm({ loading, error, onSubmit, onSwitchToLogin }: RegisterFormProps) {
  const { t, messages } = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const emailError = validateEmailLocalized(email, messages.authValidation)
    const passwordError = validateAccountPasswordLocalized(password, messages.authValidation)

    if (emailError || passwordError) {
      setFormError(emailError ?? passwordError)
      return
    }

    if (password !== confirmPassword) {
      setFormError(t('auth.passwordMismatch'))
      return
    }

    setFormError(null)
    await onSubmit(email, password)
  }

  return (
    <form className="mx-auto flex w-full max-w-md flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <h2 className="text-xl font-semibold text-text">{t('auth.registerTitle')}</h2>
        <p className="mt-1 text-sm text-text-muted">{t('auth.registerSubtitle')}</p>
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
          autoComplete="new-password"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-text"
          value={password}
          onChange={setPassword}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text-muted">{t('auth.confirmPassword')}</span>
        <PasswordInput
          autoComplete="new-password"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-text"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
      </label>

      <Button type="submit" variant="primary" loading={loading}>
        {t('auth.registerAction')}
      </Button>

      <Button type="button" variant="ghost" onClick={onSwitchToLogin}>
        {t('auth.backToLogin')}
      </Button>
    </form>
  )
}