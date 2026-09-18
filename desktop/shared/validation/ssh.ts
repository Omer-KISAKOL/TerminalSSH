import {
  MAX_PORT,
  MAX_TERMINAL_COLS,
  MAX_TERMINAL_ROWS,
  MIN_PORT,
  MIN_TERMINAL_COLS,
  MIN_TERMINAL_ROWS,
} from '@shared/constants/validation'
import type { AuthType, ConnectRequest } from '@shared/contracts/ssh'

export class IpcValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IpcValidationError'
  }
}

function assertObject(input: unknown, label: string): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new IpcValidationError(`Geçersiz ${label}.`)
  }

  return input as Record<string, unknown>
}

function assertNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new IpcValidationError(`${label} boş olamaz.`)
  }

  return value.trim()
}

function assertPort(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new IpcValidationError('Port geçerli bir sayı olmalı.')
  }

  if (value < MIN_PORT || value > MAX_PORT) {
    throw new IpcValidationError(`Port ${MIN_PORT}–${MAX_PORT} arasında olmalı.`)
  }

  return value
}

function assertAuthType(value: unknown): AuthType {
  if (value !== 'password' && value !== 'privateKey') {
    throw new IpcValidationError('Geçersiz kimlik doğrulama yöntemi.')
  }

  return value
}

function assertTerminalDimension(value: unknown, min: number, max: number, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new IpcValidationError(`Terminal ${label} geçerli bir sayı olmalı.`)
  }

  if (value < min || value > max) {
    throw new IpcValidationError(`Terminal ${label} ${min}–${max} arasında olmalı.`)
  }

  return value
}

function assertOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new IpcValidationError('Geçersiz metin alanı.')
  }

  return value
}

export function assertConnectRequest(input: unknown): ConnectRequest {
  const value = assertObject(input, 'bağlantı isteği')
  const host = assertNonEmptyString(value.host, 'Sunucu adresi')
  const port = assertPort(value.port)
  const username = assertNonEmptyString(value.username, 'Kullanıcı adı')
  const authType = assertAuthType(value.authType)
  const cols = assertTerminalDimension(
    value.cols,
    MIN_TERMINAL_COLS,
    MAX_TERMINAL_COLS,
    'genişliği',
  )
  const rows = assertTerminalDimension(
    value.rows,
    MIN_TERMINAL_ROWS,
    MAX_TERMINAL_ROWS,
    'yüksekliği',
  )
  const profileId = assertOptionalString(value.profileId)
  const password = assertOptionalString(value.password)
  const privateKeyPath = assertOptionalString(value.privateKeyPath)
  const passphrase = assertOptionalString(value.passphrase)

  if (authType === 'password' && !profileId && !password) {
    throw new IpcValidationError('Parola boş olamaz.')
  }

  if (authType === 'privateKey' && !profileId && !privateKeyPath) {
    throw new IpcValidationError('Özel anahtar dosyası seçilmeli.')
  }

  return {
    profileId,
    host,
    port,
    username,
    authType,
    password,
    privateKeyPath,
    passphrase,
    cols,
    rows,
  }
}

export function assertSessionId(input: unknown): string {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new IpcValidationError('Geçersiz oturum kimliği.')
  }

  return input.trim()
}

export function assertWritePayload(input: unknown): { sessionId: string; data: string } {
  const value = assertObject(input, 'yazma isteği')
  const sessionId = assertSessionId(value.sessionId)

  if (typeof value.data !== 'string') {
    throw new IpcValidationError('Terminal girdisi geçersiz.')
  }

  return { sessionId, data: value.data }
}

export function assertResizePayload(input: unknown): {
  sessionId: string
  cols: number
  rows: number
} {
  const value = assertObject(input, 'boyutlandırma isteği')
  const sessionId = assertSessionId(value.sessionId)
  const cols = assertTerminalDimension(
    value.cols,
    MIN_TERMINAL_COLS,
    MAX_TERMINAL_COLS,
    'genişliği',
  )
  const rows = assertTerminalDimension(
    value.rows,
    MIN_TERMINAL_ROWS,
    MAX_TERMINAL_ROWS,
    'yüksekliği',
  )

  return { sessionId, cols, rows }
}

export function assertDisconnectPayload(input: unknown): { sessionId: string } {
  const value = assertObject(input, 'bağlantı kesme isteği')
  return { sessionId: assertSessionId(value.sessionId) }
}
