import { useState } from 'react'

import type { ConnectionFormValues } from '@shared/contracts/ssh'

import { DEFAULT_CONNECTION_FORM, validateConnectionForm } from '@/lib/connection-form'

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
        {showProfileFields ? (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm text-text-muted">
              Profil adı
            </label>
            <input
              id="name"
              type="text"
              autoComplete="off"
              disabled={isDisabled}
              value={values.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Üretim Ubuntu"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
            />
          </div>
        ) : null}

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
            <label className="flex items-center gap-2 text-sm text-text">
              <input
                type="radio"
                name="authType"
                value="privateKey"
                disabled={isDisabled}
                checked={values.authType === 'privateKey'}
                onChange={() => updateField('authType', 'privateKey')}
              />
              Özel anahtar
            </label>
          </div>
        </div>

        {values.authType === 'password' ? (
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
              placeholder={values.hasSavedPassword ? 'Kayıtlı parola kullanılacak' : undefined}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
            />
            {values.hasSavedPassword ? (
              <p className="mt-1 text-xs text-text-muted">
                Bu profilde kayıtlı parola var. Değiştirmek için yeni parola girin.
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
                Parolayı kaydet
              </label>
            ) : null}
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="privateKeyPath" className="mb-1.5 block text-sm text-text-muted">
                Özel anahtar dosyası
              </label>
              <div className="flex gap-2">
                <input
                  id="privateKeyPath"
                  type="text"
                  readOnly
                  disabled={isDisabled}
                  value={values.privateKeyPath}
                  placeholder="Dosya seçilmedi"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none disabled:opacity-60"
                />
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => void handleSelectPrivateKey()}
                  className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-text transition hover:bg-surface disabled:opacity-60"
                >
                  Seç
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="passphrase" className="mb-1.5 block text-sm text-text-muted">
                Passphrase (isteğe bağlı)
              </label>
              <input
                id="passphrase"
                type="password"
                autoComplete="off"
                disabled={isDisabled}
                value={values.passphrase}
                onChange={(event) => updateField('passphrase', event.target.value)}
                placeholder={
                  values.hasSavedPassphrase ? 'Kayıtlı passphrase kullanılacak' : undefined
                }
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-accent disabled:opacity-60"
              />
              {values.hasSavedPassphrase ? (
                <p className="mt-1 text-xs text-text-muted">
                  Bu profilde kayıtlı passphrase var. Değiştirmek için yeni passphrase girin.
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
                  Passphrase kaydet
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
            Bu sunucuyu kaydet
          </label>
        ) : null}
      </div>

      {errorMessage ? <p className="mt-4 text-sm text-status-error">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={isDisabled}
        className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Bağlanıyor…' : mode === 'edit' ? 'Güncelle ve Bağlan' : 'Bağlan'}
      </button>
    </form>
  )
}
