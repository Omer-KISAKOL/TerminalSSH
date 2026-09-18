import { useState } from 'react'

import type { ConnectionFormValues } from '@shared/contracts/ssh'

import { SnippetPanel } from '@/components/snippets/SnippetPanel'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
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
      setSubmitError(toUserErrorMessage(error))
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
              Sunucu adı
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
            className="field-input"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="port" className="mb-1.5 block text-sm font-medium text-text">
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
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-text">
              Kullanıcı adı
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
          <legend className="mb-1.5 block text-sm font-medium text-text">Kimlik doğrulama</legend>
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
        </fieldset>

        {values.authType === 'password' ? (
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text">
              Parola
            </label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              disabled={isDisabled}
              value={values.password}
              onChange={(value) => updateField('password', value)}
              placeholder={values.hasSavedPassword ? 'Kayıtlı parola kullanılacak' : undefined}
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
              <label htmlFor="privateKeyPath" className="mb-1.5 block text-sm font-medium text-text">
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
                  className="field-input min-w-0 flex-1"
                />
                <Button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => void handleSelectPrivateKey()}
                  aria-label="Özel anahtar dosyası seç"
                >
                  Seç
                </Button>
              </div>
            </div>

            <div>
              <label htmlFor="passphrase" className="mb-1.5 block text-sm font-medium text-text">
                Passphrase (isteğe bağlı)
              </label>
              <PasswordInput
                id="passphrase"
                autoComplete="off"
                disabled={isDisabled}
                value={values.passphrase}
                onChange={(value) => updateField('passphrase', value)}
                placeholder={
                  values.hasSavedPassphrase ? 'Kayıtlı passphrase kullanılacak' : undefined
                }
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

      {mode === 'edit' && values.profileId ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium text-text">Snippet'ler</h3>
            <p className="mt-1 text-xs text-text-muted">
              Bu sunucuya özel komut ve metin parçaları.
            </p>
          </div>
          <div className="max-h-96 overflow-hidden">
            <SnippetPanel profileId={values.profileId} mode="profile" embedded />
          </div>
        </div>
      ) : null}

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
        {mode === 'edit' ? 'Güncelle ve Bağlan' : 'Bağlan'}
      </Button>
    </form>
  )
}
