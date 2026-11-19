import type {
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetQuestionRequest,
  RegisterRequest,
  SecuritySetupRequest,
} from '@shared/contracts/auth'
import { isSecurityQuestionId } from '@shared/constants/security-questions'
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

export function validateSecurityAnswer(securityAnswer: string): string | null {
  const trimmed = securityAnswer.trim()

  if (trimmed.length < 2) {
    return 'Güvenlik cevabı en az 2 karakter olmalıdır.'
  }

  if (trimmed.length > 120) {
    return 'Güvenlik cevabı çok uzun.'
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
  if (!input || typeof input !== 'object') {
    throw new IpcValidationError('Geçersiz kayıt isteği.')
  }

  const payload = input as Partial<RegisterRequest>
  const base = assertLoginRequest({
    email: payload.email,
    password: payload.password,
    deviceName: payload.deviceName,
  })

  const questionId = payload.securityQuestionId

  if (!questionId || !isSecurityQuestionId(questionId)) {
    throw new IpcValidationError('Geçerli bir güvenlik sorusu seçin.')
  }

  const answerError = validateSecurityAnswer(payload.securityAnswer ?? '')

  if (answerError) {
    throw new IpcValidationError(answerError)
  }

  return {
    ...base,
    securityQuestionId: questionId,
    securityAnswer: payload.securityAnswer!.trim(),
  }
}

export function assertPasswordResetQuestionRequest(input: unknown): PasswordResetQuestionRequest {
  if (!input || typeof input !== 'object') {
    throw new IpcValidationError('Geçersiz istek.')
  }

  const payload = input as Partial<PasswordResetQuestionRequest>
  const emailError = validateEmail(payload.email ?? '')

  if (emailError) {
    throw new IpcValidationError(emailError)
  }

  return { email: payload.email!.trim() }
}

export function assertPasswordResetConfirmRequest(input: unknown): PasswordResetConfirmRequest {
  if (!input || typeof input !== 'object') {
    throw new IpcValidationError('Geçersiz istek.')
  }

  const payload = input as Partial<PasswordResetConfirmRequest>
  const emailError = validateEmail(payload.email ?? '')

  if (emailError) {
    throw new IpcValidationError(emailError)
  }

  const answerError = validateSecurityAnswer(payload.securityAnswer ?? '')
  const passwordError = validateAccountPassword(payload.newPassword ?? '')

  if (answerError) {
    throw new IpcValidationError(answerError)
  }

  if (passwordError) {
    throw new IpcValidationError(passwordError)
  }

  return {
    email: payload.email!.trim(),
    securityAnswer: payload.securityAnswer!.trim(),
    newPassword: payload.newPassword!,
  }
}

export function assertSecuritySetupRequest(input: unknown): SecuritySetupRequest {
  if (!input || typeof input !== 'object') {
    throw new IpcValidationError('Geçersiz güvenlik sorusu isteği.')
  }

  const payload = input as Partial<SecuritySetupRequest>
  const questionId = payload.securityQuestionId

  if (!questionId || !isSecurityQuestionId(questionId)) {
    throw new IpcValidationError('Geçerli bir güvenlik sorusu seçin.')
  }

  const answerError = validateSecurityAnswer(payload.securityAnswer ?? '')

  if (answerError) {
    throw new IpcValidationError(answerError)
  }

  const setupToken = payload.setupToken?.trim()

  return {
    securityQuestionId: questionId,
    securityAnswer: payload.securityAnswer!.trim(),
    setupToken: setupToken || undefined,
    deviceName: payload.deviceName?.trim() || undefined,
  }
}