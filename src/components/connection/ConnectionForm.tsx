import { useState } from 'react'

import type { ConnectionFormValues } from '@shared/contracts/ssh'

import { DEFAULT_CONNECTION_FORM, validateConnectionForm } from '@/lib/connection-form'

type ConnectionFormProps = {
  disabled?: boolean
  initialValues?: ConnectionFormValues
  onSubmit: (values: ConnectionFormValues) => Promise<void>
}

export function ConnectionForm({
  disabled = false,
  initialValues = DEFAULT_CONNECTION_FORM,
  onSubmit,
}: ConnectionFormProps) {
  const [values, setValues] = useState<ConnectionFormValues>(initialValues)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDisabled = disabled || isSubmitting

  const updateField = <K extends keyof ConnectionFormValues>(
    key: K,
    value: ConnectionFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
    setValidationError(null)
    setSubmitError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const error = validateConnectionForm(values)

    if (error) {
      setValidationError(error)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onSubmit(values)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Bağlantı kurulamadı.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const errorMessage = validationError ?? submitError

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-lg rounded-xl border border-border bg-surface-muted p-6"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="host" className="mb-1.5 block text-sm text-text-muted">
            Sunucu adresi
          </label>
          <input
            id="host"
            type="text"
            autoComplete="off"
            disabled={isDisabled}
            value={values.host}
            onChange={(event) => updateField('host', event.target.value)}
            placeholder="192.168.1.10 veya sunucu.example.com"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="port" className="mb-1.5 block text-sm text-text-muted">
              Port
            </label>
            <input
              id="port"
              type="number"
              min={1}
              max={65535}
              disabled={isDisabled}
              value={values.port}
              onChange={(event) => updateField('port', event.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm text-text-muted">
              Kullanıcı adı
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              disabled={isDisabled}
              value={values.username}
              onChange={(event) => updateField('username', event.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm text-text-muted">Kimlik doğrulama</span>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="radio"
                name="authType"
                value="password"
                disabled={isDisabled}
                checked={values.authType === 'password'}
                onChange={() => updateField('authType', 'password')}
              />
              Parola
            </label>
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="radio"
                name="authType"
                value="privateKey"
                disabled
                checked={values.authType === 'privateKey'}
                onChange={() => updateField('authType', 'privateKey')}
              />
              Özel anahtar (yakında)
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm text-text-muted">
            Parola
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            disabled={isDisabled}
            value={values.password}
            onChange={(event) => updateField('password', event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
          />
        </div>
      </div>

      {errorMessage ? <p className="mt-4 text-sm text-status-error">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={isDisabled}
        className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Bağlanıyor…' : 'Bağlan'}
      </button>
    </form>
  )
}
