import { useState } from 'react'

import type { ConnectionFormValues } from '@shared/contracts/ssh'

import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { useLocale } from '@/hooks/useLocale'
import { DEFAULT_CONNECTION_FORM, validateConnectionForm } from '@/lib/connection-form'
import { toUserErrorMessage } from '@/lib/user-error'

type ConnectionFormProps = {
  disabled?: boolean
  mode: 'create' | 'edit'
  initialValues?: ConnectionFormValues
  onSubmit: (values: ConnectionFormValues) => Promise<void>
}

export function ConnectionForm({
  disabled = false,
  mode,
  initialValues = DEFAULT_CONNECTION_FORM,
  onSubmit,
}: ConnectionFormProps) {
  const { t, messages } = useLocale()
  const [values, setValues] = useState<ConnectionFormValues>(initialValues)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDisabled = disabled || isSubmitting
  const showProfileFields = values.saveProfile || mode === 'edit'

  const updateField = <K extends keyof ConnectionFormValues>(
    key: K,
    value: ConnectionFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
    setValidationError(null)
    setSubmitError(null)
  }

  const handleSelectPrivateKey = async () => {
    const selectedPath = await window.desktopApi.files.selectPrivateKey()

    if (selectedPath) {
      updateField('privateKeyPath', selectedPath)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const error = validateConnectionForm(values, messages.validation)

    if (error) {
      setValidationError(error)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onSubmit(values)
    } catch (error) {
      setSubmitError(toUserErrorMessage(error, t('errors.connectionFailed')))
    } finally {
      setIsSubmitting(false)
    }
  }

  const errorMessage = validationError ?? submitError

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-lg rounded-xl border border-border bg-surface-muted p-6 shadow-lg shadow-black/20"
      aria-busy={isSubmitting}
    >
      <div className="space-y-4">
        {showProfileFields ? (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-text">
              {t('connection.serverName')}
            </label>
            <input
              id="name"
              type="text"
              autoComplete="off"
              disabled={isDisabled}
              value={values.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Ubuntu1"
              className="field-input"
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="host" className="mb-1.5 block text-sm font-medium text-text">
            {t('connection.serverHost')}
          </label>
          <input
            id="host"
            type="text"
            autoComplete="off"
            disabled={isDisabled}
            value={values.host}
            onChange={(event) => updateField('host', event.target.value)}
            placeholder={t('connection.hostPlaceholder')}
            className="field-input"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="port" className="mb-1.5 block text-sm font-medium text-text">
              {t('common.port')}
            </label>
            <input
              id="port"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              disabled={isDisabled}
              value={values.port}
              onChange={(event) =>
                updateField('port', event.target.value.replace(/\D/g, '').slice(0, 5))
              }
              className="field-input port-input"
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-text">
              {t('connection.username')}
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              disabled={isDisabled}
              value={values.username}
              onChange={(event) => updateField('username', event.target.value)}
              className="field-input"
            />
          </div>
        </div>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium text-text">{t('connection.authLegend')}</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="radio"
                name="authType"
                value="password"
                disabled={isDisabled}
                checked={values.authType === 'password'}
                onChange={() => updateField('authType', 'password')}
              />
              {t('connection.password')}
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="radio"
                name="authType"
                value="privateKey"
                disabled={isDisabled}
                checked={values.authType === 'privateKey'}
                onChange={() => updateField('authType', 'privateKey')}
              />
              {t('connection.privateKey')}
            </label>
          </div>
        </fieldset>

        {values.authType === 'password' ? (
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text">
              {t('connection.password')}
            </label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              disabled={isDisabled}
              value={values.password}
              onChange={(value) => updateField('password', value)}
              placeholder={
                mode !== 'edit' && values.hasSavedPassword
                  ? t('connection.savedPasswordHint')
                  : undefined
              }
            />
            {mode !== 'edit' && values.hasSavedPassword ? (
              <p className="mt-1 text-xs text-text-muted">
                {t('connection.savedPasswordHelp')}
              </p>
            ) : null}
            {showProfileFields ? (
              <label className="mt-3 flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  disabled={isDisabled}
                  checked={values.savePassword}
                  onChange={(event) => updateField('savePassword', event.target.checked)}
                />
                {t('connection.savePassword')}
              </label>
            ) : null}
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="privateKeyPath" className="mb-1.5 block text-sm font-medium text-text">
                {t('connection.privateKeyFile')}
              </label>
              <div className="flex gap-2">
                <input
                  id="privateKeyPath"
                  type="text"
                  readOnly
                  disabled={isDisabled}
                  value={values.privateKeyPath}
                  placeholder={t('connection.privateKeyPlaceholder')}
                  className="field-input min-w-0 flex-1"
                />
                <Button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => void handleSelectPrivateKey()}
                  aria-label={t('connection.privateKeyAria')}
                >
                  {t('common.select')}
                </Button>
              </div>
            </div>

            <div>
              <label htmlFor="passphrase" className="mb-1.5 block text-sm font-medium text-text">
                {t('connection.passphraseOptional')}
              </label>
              <PasswordInput
                id="passphrase"
                autoComplete="off"
                disabled={isDisabled}
                value={values.passphrase}
                onChange={(value) => updateField('passphrase', value)}
                placeholder={
                  mode !== 'edit' && values.hasSavedPassphrase
                    ? t('connection.savedPassphraseHint')
                    : undefined
                }
              />
              {mode !== 'edit' && values.hasSavedPassphrase ? (
                <p className="mt-1 text-xs text-text-muted">
                  {t('connection.savedPassphraseHelp')}
                </p>
              ) : null}
              {showProfileFields ? (
                <label className="mt-3 flex items-center gap-2 text-sm text-text">
                  <input
                    type="checkbox"
                    disabled={isDisabled}
                    checked={values.savePassphrase}
                    onChange={(event) => updateField('savePassphrase', event.target.checked)}
                  />
                  {t('connection.savePassphrase')}
                </label>
              ) : null}
            </div>
          </>
        )}

        {mode === 'create' ? (
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              disabled={isDisabled}
              checked={values.saveProfile}
              onChange={(event) => updateField('saveProfile', event.target.checked)}
            />
            {t('connection.saveServer')}
          </label>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2 text-sm text-status-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        disabled={isDisabled}
        loading={isSubmitting}
        className="mt-6 w-full py-2.5"
      >
        {mode === 'edit' ? t('connection.updateAndConnect') : t('connection.connect')}
      </Button>
    </form>
  )
}
