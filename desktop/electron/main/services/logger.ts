import { app } from 'electron'

function isProductionMode(): boolean {
  return app.isPackaged
}

const SENSITIVE_KEYS = new Set([
  'password',
  'passphrase',
  'privateKey',
  'privateKeyPath',
  'encryptedPassword',
  'encryptedPassphrase',
  'connectRequest',
  'payload',
  'data',
])

const ALLOWED_KEYS = new Set([
  'authType',
  'host',
  'port',
  'username',
  'sessionId',
  'profileId',
  'verificationId',
  'kind',
  'code',
  'webContentsId',
])

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.has(key)) {
      sanitized[key] = '[REDACTED]'
      continue
    }

    if (ALLOWED_KEYS.has(key)) {
      sanitized[key] = value
      continue
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMeta(value as Record<string, unknown>)
      continue
    }

    if (isProductionMode()) {
      sanitized[key] = '[REDACTED]'
      continue
    }

    sanitized[key] = value
  }

  return sanitized
}

function formatMessage(message: string, meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0 || isProductionMode()) {
    return message
  }

  return `${message} ${JSON.stringify(sanitizeMeta(meta))}`
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (!isProductionMode()) {
      console.debug(formatMessage(message, meta))
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(formatMessage(message, meta))
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(formatMessage(message, meta))
  },

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(formatMessage(message, meta))
  },
}
