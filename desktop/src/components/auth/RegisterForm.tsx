import { useState } from 'react'

import {
  validateAccountPasswordLocalized,
  validateEmailLocalized,
} from '@/lib/auth-validation'

import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useLocale } from '@/hooks/useLocale'

import { AuthFormFrame, authButtonClass, authFieldClass, authLabelClass } from './AuthFormFrame'

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

  const displayError = formError ?? error

  return (
    <AuthFormFrame
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      error={displayError}
      footer={
        <Button type="button" variant="secondary" className={authButtonClass} onClick={onSwitchToLogin}>
          {t('auth.backToLogin')}
        </Button>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={authLabelClass}>{t('auth.email')}</span>
          <input
            type="email"
            autoComplete="email"
            className={authFieldClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className={authLabelClass}>{t('auth.password')}</span>
          <div className="[&_button]:text-white/55 [&_button:hover]:text-white">
            <PasswordInput
              autoComplete="new-password"
              className={authFieldClass}
              value={password}
              onChange={setPassword}
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className={authLabelClass}>{t('auth.confirmPassword')}</span>
          <div className="[&_button]:text-white/55 [&_button:hover]:text-white">
            <PasswordInput
              autoComplete="new-password"
              className={authFieldClass}
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          </div>
        </label>

        <Button type="submit" variant="primary" className={authButtonClass} loading={loading}>
          {t('auth.registerAction')}
        </Button>
      </form>
    </AuthFormFrame>
  )
}