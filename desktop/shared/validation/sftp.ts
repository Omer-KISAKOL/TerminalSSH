import { MAX_PORT, MIN_PORT } from '@shared/constants/validation'
import type { SftpConnectRequest, SftpListDirRequest, SftpTransferRequest } from '@shared/contracts/sftp'

import { IpcValidationError } from '@shared/validation/ssh'

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

function assertAuthType(value: unknown): 'password' | 'privateKey' {
  if (value !== 'password' && value !== 'privateKey') {
    throw new IpcValidationError('Geçersiz kimlik doğrulama yöntemi.')
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

function assertSessionId(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new IpcValidationError('Geçersiz oturum kimliği.')
  }

  return value.trim()
}

export function assertSftpConnectRequest(input: unknown): SftpConnectRequest {
  const value = assertObject(input, 'SFTP bağlantı isteği')
  const host = assertNonEmptyString(value.host, 'Sunucu adresi')
  const port = assertPort(value.port)
  const username = assertNonEmptyString(value.username, 'Kullanıcı adı')
  const authType = assertAuthType(value.authType)
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
  }
}

export function assertSftpSessionPayload(input: unknown): { sessionId: string } {
  const value = assertObject(input, 'SFTP oturum isteği')
  return { sessionId: assertSessionId(value.sessionId) }
}

export function assertSftpListDirRequest(input: unknown): SftpListDirRequest {
  const value = assertObject(input, 'SFTP dizin isteği')
  return {
    sessionId: assertSessionId(value.sessionId),
    path: assertNonEmptyString(value.path, 'Dizin yolu'),
  }
}

export function assertSftpTransferRequest(input: unknown): SftpTransferRequest {
  const value = assertObject(input, 'SFTP transfer isteği')
  return {
    sessionId: assertSessionId(value.sessionId),
    localPath: assertNonEmptyString(value.localPath, 'Yerel dosya yolu'),
    remotePath: assertNonEmptyString(value.remotePath, 'Uzak dosya yolu'),
  }
}

export function assertLocalListDirRequest(input: unknown): { path: string } {
  const value = assertObject(input, 'yerel dizin isteği')
  return { path: assertNonEmptyString(value.path, 'Dizin yolu') }
}
