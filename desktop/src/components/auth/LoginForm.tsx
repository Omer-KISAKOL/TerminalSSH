import { useState } from 'react'

import {
  validateAccountPasswordLocalized,
  validateEmailLocalized,
} from '@/lib/auth-validation'

import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useLocale } from '@/hooks/useLocale'

import { AuthFormFrame, authButtonClass, authFieldClass, authLabelClass } from './AuthFormFrame'

type LoginFormProps = {
  loading: boolean
  error: string | null
  onSubmit: (email: string, password: string) => Promise<void>
  onSwitchToRegister: () => void
  onForgotPassword: () => void
  onContinueOffline: () => void
}

export function LoginForm({
  loading,
  error,
  onSubmit,
  onSwitchToRegister,
  onForgotPassword,
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

  const displayError = formError ?? error

  return (
    <AuthFormFrame
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
      error={displayError}
      footer={
        <>
          <Button type="button" variant="secondary" className={authButtonClass} onClick={onSwitchToRegister}>
            {t('auth.register')}
          </Button>
          <Button type="button" variant="secondary" className={authButtonClass} onClick={onContinueOffline}>
            {t('auth.offline')}
          </Button>
        </>
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
          <div className="flex items-center justify-between gap-2">
            <span className={authLabelClass}>{t('auth.password')}</span>
            <button
              type="button"
              className="text-xs text-status-connected underline-offset-2 hover:underline"
              onClick={onForgotPassword}
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
          <div className="[&_button]:text-white/55 [&_button:hover]:text-white">
            <PasswordInput
              autoComplete="current-password"
              className={authFieldClass}
              value={password}
              onChange={setPassword}
            />
          </div>
        </label>

        <Button type="submit" variant="secondary" className={authButtonClass} loading={loading}>
          {t('auth.login')}
        </Button>
      </form>
    </AuthFormFrame>
  )
}