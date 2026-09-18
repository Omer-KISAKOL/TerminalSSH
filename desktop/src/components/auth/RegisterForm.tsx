import { useState } from 'react'

import { validateAccountPassword, validateEmail } from '@shared/validation/auth'

import { Button } from '@/components/ui/Button'

type RegisterFormProps = {
  loading: boolean
  error: string | null
  onSubmit: (email: string, password: string) => Promise<void>
  onSwitchToLogin: () => void
}

export function RegisterForm({ loading, error, onSubmit, onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const emailError = validateEmail(email)
    const passwordError = validateAccountPassword(password)

    if (emailError || passwordError) {
      setFormError(emailError ?? passwordError)
      return
    }

    if (password !== confirmPassword) {
      setFormError('Parolalar eşleşmiyor.')
      return
    }

    setFormError(null)
    await onSubmit(email, password)
  }

  return (
    <form className="mx-auto flex w-full max-w-md flex-col gap-4" onSubmit={(event) => void handleSubmit(event)}>
      <div>
        <h2 className="text-xl font-semibold text-white">Hesap oluştur</h2>
        <p className="mt-1 text-sm text-text-muted">Profilleriniz güvenli biçimde bulutta saklanır.</p>
      </div>

      {error || formError ? (
        <p className="rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2 text-sm text-status-error">
          {formError ?? error}
        </p>
      ) : null}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text-muted">E-posta</span>
        <input
          type="email"
          autoComplete="email"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-text"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text-muted">Parola</span>
        <input
          type="password"
          autoComplete="new-password"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-text"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-text-muted">Parola tekrar</span>
        <input
          type="password"
          autoComplete="new-password"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-text"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </label>

      <Button type="submit" variant="primary" loading={loading}>
        Kayıt ol
      </Button>

      <Button type="button" variant="ghost" onClick={onSwitchToLogin}>
        Giriş ekranına dön
      </Button>
    </form>
  )
}
