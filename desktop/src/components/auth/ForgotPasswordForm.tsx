import { useState } from 'react'

import type { SecurityQuestionId } from '@shared/constants/security-questions'

import {
  validateAccountPasswordLocalized,
  validateEmailLocalized,
  validateSecurityAnswerLocalized,
} from '@/lib/auth-validation'

import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useLocale } from '@/hooks/useLocale'

import { AuthFormFrame, authButtonClass, authFieldClass, authLabelClass } from './AuthFormFrame'

type ForgotPasswordFormProps = {
  loading: boolean
  error: string | null
  onRequestQuestion: (email: string) => Promise<{ securityQuestionId: SecurityQuestionId }>
  onResetPassword: (email: string, securityAnswer: string, newPassword: string) => Promise<void>
  onBackToLogin: () => void
}

export function ForgotPasswordForm({
  loading,
  error,
  onRequestQuestion,
  onResetPassword,
  onBackToLogin,
}: ForgotPasswordFormProps) {
  const { t, messages } = useLocale()
  const [step, setStep] = useState<'email' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [securityQuestionId, setSecurityQuestionId] = useState<SecurityQuestionId | null>(null)
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const displayError = formError ?? error

  const handleEmailStep = async (event: React.FormEvent) => {
    event.preventDefault()
    const emailError = validateEmailLocalized(email, messages.authValidation)

    if (emailError) {
      setFormError(emailError)
      return
    }

    setFormError(null)

    try {
      const response = await onRequestQuestion(email)
      setSecurityQuestionId(response.securityQuestionId)
      setStep('reset')
    } catch {
      // Error surfaced via parent `error` prop
    }
  }

  const handleResetStep = async (event: React.FormEvent) => {
    event.preventDefault()

    const answerError = validateSecurityAnswerLocalized(securityAnswer, messages.authValidation)
    const passwordError = validateAccountPasswordLocalized(newPassword, messages.authValidation)

    if (answerError || passwordError) {
      setFormError(answerError ?? passwordError)
      return
    }

    if (newPassword !== confirmPassword) {
      setFormError(t('auth.passwordMismatch'))
      return
    }

    setFormError(null)

    try {
      await onResetPassword(email, securityAnswer, newPassword)
      setSuccess(true)
    } catch {
      // Error surfaced via parent `error` prop
    }
  }

  const questionLabel =
    securityQuestionId != null
      ? t(`auth.securityQuestions.${securityQuestionId}`)
      : ''

  return (
    <AuthFormFrame
      title={t('auth.forgotPasswordTitle')}
      subtitle={
        success
          ? t('auth.resetPasswordSuccess')
          : step === 'email'
            ? t('auth.forgotPasswordSubtitleEmail')
            : t('auth.forgotPasswordSubtitleAnswer')
      }
      error={success ? null : displayError}
      footer={
        <Button type="button" variant="secondary" className={authButtonClass} onClick={onBackToLogin}>
          {t('auth.backToLogin')}
        </Button>
      }
    >
      {success ? null : step === 'email' ? (
        <form className="flex flex-col gap-4" onSubmit={(event) => void handleEmailStep(event)}>
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

          <Button type="submit" variant="secondary" className={authButtonClass} loading={loading}>
            {t('auth.continue')}
          </Button>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={(event) => void handleResetStep(event)}>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className={authLabelClass}>{t('auth.email')}</span>
            <input type="email" className={authFieldClass} value={email} disabled readOnly />
          </label>

          <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white/90">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/55">
              {t('auth.securityQuestion')}
            </p>
            <p className="mt-1">{questionLabel}</p>
          </div>

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
                value={newPassword}
                onChange={setNewPassword}
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
            {t('auth.resetPassword')}
          </Button>
        </form>
      )}
    </AuthFormFrame>
  )
}