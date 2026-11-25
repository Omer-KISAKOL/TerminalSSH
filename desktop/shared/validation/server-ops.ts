import { IpcValidationError } from './ssh'

function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new IpcValidationError(`${field} gerekli.`)
  }

  return value.trim()
}

export function assertCollectIntelligenceRequest(input: unknown): { sessionId: string } {
  if (!input || typeof input !== 'object') {
    throw new IpcValidationError('Geçersiz istek.')
  }

  const record = input as Record<string, unknown>

  return {
    sessionId: assertNonEmptyString(record.sessionId, 'sessionId'),
  }
}

export function assertGetServerOpsContextRequest(input: unknown): { sessionId: string } {
  return assertCollectIntelligenceRequest(input)
}

export function assertListTimelineRequest(input: unknown): { serverKey: string; limit?: number } {
  if (!input || typeof input !== 'object') {
    throw new IpcValidationError('Geçersiz istek.')
  }

  const record = input as Record<string, unknown>
  const serverKey = assertNonEmptyString(record.serverKey, 'serverKey')

  let limit: number | undefined

  if (record.limit !== undefined) {
    if (typeof record.limit !== 'number' || !Number.isFinite(record.limit) || record.limit < 1) {
      throw new IpcValidationError('limit geçersiz.')
    }

    limit = Math.min(Math.floor(record.limit), 200)
  }

  return { serverKey, limit }
}

export function assertCollectConfigDriftRequest(input: unknown): {
  sessionId: string
  resetBaseline?: boolean
} {
  if (!input || typeof input !== 'object') {
    throw new IpcValidationError('Geçersiz istek.')
  }

  const record = input as Record<string, unknown>
  const sessionId = assertNonEmptyString(record.sessionId, 'sessionId')
  const resetBaseline = record.resetBaseline === true ? true : undefined

  return { sessionId, resetBaseline }
}

export function assertRecordSuggestionRequest(input: unknown): {
  sessionId: string
  label: string
  command: string
} {
  if (!input || typeof input !== 'object') {
    throw new IpcValidationError('Geçersiz istek.')
  }

  const record = input as Record<string, unknown>

  return {
    sessionId: assertNonEmptyString(record.sessionId, 'sessionId'),
    label: assertNonEmptyString(record.label, 'label'),
    command: assertNonEmptyString(record.command, 'command'),
  }
}