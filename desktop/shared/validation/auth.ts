import type { LoginRequest, RegisterRequest } from '@shared/contracts/auth'
import { IpcValidationError } from '@shared/validation/ssh'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
  const trimmed = email.trim()

  if (!trimmed) {
    return 'E-posta gerekli.'
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Geçerli bir e-posta adresi girin.'
  }

  return null
}

export function validateAccountPassword(password: string): string | null {
  if (!password) {
    return 'Parola gerekli.'
  }

  if (password.length < 8) {
    return 'Parola en az 8 karakter olmalıdır.'
  }

  return null
}

export function assertLoginRequest(input: unknown): LoginRequest {
  if (!input || typeof input !== 'object') {
    throw new IpcValidationError('Geçersiz giriş isteği.')
  }

  const payload = input as Partial<LoginRequest>
  const emailError = validateEmail(payload.email ?? '')
  const passwordError = validateAccountPassword(payload.password ?? '')

  if (emailError) {
    throw new IpcValidationError(emailError)
  }

  if (passwordError) {
    throw new IpcValidationError(passwordError)
  }

  return {
    email: payload.email!.trim(),
    password: payload.password!,
    deviceName: payload.deviceName?.trim() || undefined,
  }
}

export function assertRegisterRequest(input: unknown): RegisterRequest {
  return assertLoginRequest(input)
}
