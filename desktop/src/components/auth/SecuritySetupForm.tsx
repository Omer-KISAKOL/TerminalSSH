import { useState } from 'react'

import { SECURITY_QUESTION_IDS, type SecurityQuestionId } from '@shared/constants/security-questions'

import { validateSecurityAnswerLocalized } from '@/lib/auth-validation'
import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'

import { AuthFormFrame, authButtonClass, authFieldClass, authLabelClass } from './AuthFormFrame'

type SecuritySetupFormProps = {
  email: string
  loading: boolean
  error: string | null
  onSubmit: (securityQuestionId: SecurityQuestionId, securityAnswer: string) => Promise<void>
  onCancel?: () => void
  cancelLabel?: string
}

export function SecuritySetupForm({
  email,
  loading,
  error,
  onSubmit,
  onCancel,
  cancelLabel,
}: SecuritySetupFormProps) {
  const { t, messages } = useLocale()
  const [securityQuestionId, setSecurityQuestionId] = useState<SecurityQuestionId | ''>('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const securityAnswerError = validateSecurityAnswerLocalized(securityAnswer, messages.authValidation)

    if (securityAnswerError) {
      setFormError(securityAnswerError)
      return
    }

    if (!securityQuestionId) {
      setFormError(t('auth.securityQuestionRequired'))
      return
    }

    setFormError(null)
    await onSubmit(securityQuestionId, securityAnswer)
  }

  const displayError = formError ?? error

  return (
    <AuthFormFrame
      title={t('auth.securitySetupTitle')}
      subtitle={t('auth.securitySetupSubtitle')}
      error={displayError}
      footer={
        onCancel ? (
          <Button type="button" variant="secondary" className={authButtonClass} onClick={onCancel}>
            {cancelLabel ?? t('auth.backToLogin')}
          </Button>
        ) : null
      }
    >
      <form className="flex flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className={authLabelClass}>{t('auth.email')}</span>
          <input
            type="email"
            readOnly
            className={`${authFieldClass} cursor-default opacity-80`}
            value={email}
            aria-readonly="true"
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

        <Button type="submit" variant="primary" className={authButtonClass} loading={loading}>
          {t('auth.securitySetupAction')}
        </Button>
      </form>
    </AuthFormFrame>
  )
}