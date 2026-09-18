import { SSH_ERROR_MESSAGES } from '@shared/errors/ssh-messages'

export function mapSshError(error: unknown, sessionReason?: string | null): string {
  if (sessionReason) {
    return sessionReason
  }

  if (!error || typeof error !== 'object') {
    return SSH_ERROR_MESSAGES.GENERIC
  }

  const value = error as { code?: string; level?: string; message?: string }

  switch (value.code) {
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return SSH_ERROR_MESSAGES.DNS_ERROR
    case 'ECONNREFUSED':
      return SSH_ERROR_MESSAGES.CONNECTION_REFUSED
    case 'EHOSTUNREACH':
    case 'ENETUNREACH':
      return SSH_ERROR_MESSAGES.HOST_UNREACHABLE
    case 'ETIMEDOUT':
    case 'ECONNRESET':
      return SSH_ERROR_MESSAGES.TIMEOUT
    case 'EACCES':
    case 'EPERM':
      return SSH_ERROR_MESSAGES.PERMISSION_DENIED
    default:
      break
  }

  const message = value.message?.toLowerCase() ?? ''

  if (message.includes('host denied')) {
    return SSH_ERROR_MESSAGES.HOST_REJECTED
  }

  if (
    message.includes('authentication failed') ||
    message.includes('all configured authentication methods failed')
  ) {
    return SSH_ERROR_MESSAGES.AUTH_FAILED
  }

  if (message.includes('cannot parse privatekey') || message.includes('bad passphrase')) {
    return SSH_ERROR_MESSAGES.PRIVATE_KEY_ERROR
  }

  if (message.includes('passphrase') && message.includes('decrypt')) {
    return SSH_ERROR_MESSAGES.PRIVATE_KEY_ERROR
  }

  if (message.includes('timed out') || message.includes('timeout')) {
    return SSH_ERROR_MESSAGES.TIMEOUT
  }

  if (message.includes('getaddrinfo')) {
    return SSH_ERROR_MESSAGES.DNS_ERROR
  }

  if (message.includes('connect') && message.includes('refused')) {
    return SSH_ERROR_MESSAGES.CONNECTION_REFUSED
  }

  return SSH_ERROR_MESSAGES.GENERIC
}
