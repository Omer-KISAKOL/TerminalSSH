import { useState } from 'react'

import { SECURITY_QUESTION_IDS, type SecurityQuestionId } from '@shared/constants/security-questions'

import {
  validateAccountPasswordLocalized,
  validateEmailLocalized,
  validateSecurityAnswerLocalized,
} from '@/lib/auth-validation'

import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useLocale } from '@/hooks/useLocale'

import { AuthFormFrame, authButtonClass, authFieldClass, authLabelClass } from './AuthFormFrame'

type RegisterFormProps = {
  loading: boolean
  error: string | null
  onSubmit: (
    email: string,
    password: string,
    securityQuestionId: SecurityQuestionId,
    securityAnswer: string,
  ) => Promise<void>
  onSwitchToLogin: () => void
}

export function RegisterForm({ loading, error, onSubmit, onSwitchToLogin }: RegisterFormProps) {
  const { t, messages } = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [securityQuestionId, setSecurityQuestionId] = useState<SecurityQuestionId | ''>('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const emailError = validateEmailLocalized(email, messages.authValidation)
    const passwordError = validateAccountPasswordLocalized(password, messages.authValidation)
    const securityAnswerError = validateSecurityAnswerLocalized(securityAnswer, messages.authValidation)

    if (emailError || passwordError || securityAnswerError) {
      setFormError(emailError ?? passwordError ?? securityAnswerError)
      return
    }

    if (!securityQuestionId) {
      setFormError(t('auth.securityQuestionRequired'))
      return
    }

    if (password !== confirmPassword) {
      setFormError(t('auth.passwordMismatch'))
      return
    }

    setFormError(null)
    await onSubmit(email, password, securityQuestionId, securityAnswer)
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
          <span className={authLabelClass}>{t('auth.securityQuestion')}</span>
          <select
            className={authFieldClass}
            value={securityQuestionId}
            onChange={(event) => setSecurityQuestionId(event.target.value as SecurityQuestionId | '')}
          >
            <option value="">{t('auth.selectSecurityQuestion')}</option>
            {SECURITY_QUESTION_IDS.map((id) => (
              <option key={id} value={id}>
                {t(`auth.securityQuestions.${id}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className={authLabelClass}>{t('auth.securityAnswer')}</span>
          <input
            type="text"
            autoComplete="off"
            className={authFieldClass}
            value={securityAnswer}
            onChange={(event) => setSecurityAnswer(event.target.value)}
          />
          <span className="text-xs text-white/50">{t('auth.securityAnswerHint')}</span>
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