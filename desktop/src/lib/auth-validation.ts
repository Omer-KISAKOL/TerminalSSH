import type { Messages } from '@/lib/i18n/catalog'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type AuthValidationMessages = Messages['authValidation']

export function validateEmailLocalized(
  email: string,
  messages: AuthValidationMessages,
): string | null {
  const trimmed = email.trim()

  if (!trimmed) {
    return messages.emailRequired
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return messages.emailInvalid
  }

  return null
}

export function validateAccountPasswordLocalized(
  password: string,
  messages: AuthValidationMessages,
): string | null {
  if (!password) {
    return messages.passwordRequired
  }

  if (password.length < 8) {
    return messages.passwordMin
  }

  return null
}

export function validateSecurityAnswerLocalized(
  securityAnswer: string,
  messages: AuthValidationMessages,
): string | null {
  const trimmed = securityAnswer.trim()

  if (trimmed.length < 2) {
    return messages.securityAnswerMin
  }

  if (trimmed.length > 120) {
    return messages.securityAnswerMax
  }

  return null
}