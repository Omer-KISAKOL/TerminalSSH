import type { AuthType, ConnectRequest } from '@shared/contracts/ssh'

const MIN_PORT = 1
const MAX_PORT = 65535
const MIN_COLS = 1
const MAX_COLS = 500
const MIN_ROWS = 1
const MAX_ROWS = 200

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

function assertTerminalDimension(
  value: unknown,
  min: number,
  max: number,
  label: string,
): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new IpcValidationError(`Terminal ${label} geçerli bir sayı olmalı.`)
  }

  if (value < min || value > max) {
    throw new IpcValidationError(`Terminal ${label} ${min}–${max} arasında olmalı.`)
  }

  return value
}

export function assertConnectRequest(input: unknown): ConnectRequest {
  const value = assertObject(input, 'bağlantı isteği')
  const host = assertNonEmptyString(value.host, 'Sunucu adresi')
  const port = assertPort(value.port)
  const username = assertNonEmptyString(value.username, 'Kullanıcı adı')
  const authType = assertAuthType(value.authType)
  const cols = assertTerminalDimension(value.cols, MIN_COLS, MAX_COLS, 'genişliği')
  const rows = assertTerminalDimension(value.rows, MIN_ROWS, MAX_ROWS, 'yüksekliği')

  let password: string | undefined

  if (authType === 'password') {
    if (typeof value.password !== 'string' || value.password.length === 0) {
      throw new IpcValidationError('Parola boş olamaz.')
    }

    password = value.password
  }

  if (authType === 'privateKey') {
    throw new IpcValidationError('Özel anahtar kimlik doğrulaması henüz desteklenmiyor.')
  }

  return {
    host,
    port,
    username,
    authType,
    password,
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

export function assertWritePayload(
  input: unknown,
): { sessionId: string; data: string } {
  const value = assertObject(input, 'yazma isteği')
  const sessionId = assertSessionId(value.sessionId)

  if (typeof value.data !== 'string') {
    throw new IpcValidationError('Terminal girdisi geçersiz.')
  }

  return { sessionId, data: value.data }
}

export function assertResizePayload(
  input: unknown,
): { sessionId: string; cols: number; rows: number } {
  const value = assertObject(input, 'boyutlandırma isteği')
  const sessionId = assertSessionId(value.sessionId)
  const cols = assertTerminalDimension(value.cols, MIN_COLS, MAX_COLS, 'genişliği')
  const rows = assertTerminalDimension(value.rows, MIN_ROWS, MAX_ROWS, 'yüksekliği')

  return { sessionId, cols, rows }
}

export function assertDisconnectPayload(input: unknown): { sessionId: string } {
  const value = assertObject(input, 'bağlantı kesme isteği')
  return { sessionId: assertSessionId(value.sessionId) }
}
