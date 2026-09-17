const isDev = process.env.NODE_ENV !== 'production'

const SENSITIVE_KEYS = ['password', 'passphrase', 'privateKey', 'privateKeyPath']

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.includes(key)) {
      sanitized[key] = '[REDACTED]'
      continue
    }

    if (key === 'authType' || key === 'host' || key === 'port' || key === 'username') {
      sanitized[key] = value
      continue
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeMeta(value as Record<string, unknown>)
      continue
    }

    sanitized[key] = value
  }

  return sanitized
}

function formatMessage(message: string, meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) {
    return message
  }

  return `${message} ${JSON.stringify(sanitizeMeta(meta))}`
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (isDev) {
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
