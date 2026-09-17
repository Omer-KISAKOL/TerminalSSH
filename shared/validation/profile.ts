import type { AuthType } from '@shared/contracts/ssh'
import type { SaveProfileRequest } from '@shared/contracts/profile'

import { IpcValidationError } from '@shared/validation/ssh'

const MIN_PORT = 1
const MAX_PORT = 65535

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

function assertOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value !== 'string') {
    throw new IpcValidationError('Geçersiz metin alanı.')
  }

  return value
}

function assertBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null) {
    return fallback
  }

  if (typeof value !== 'boolean') {
    throw new IpcValidationError('Geçersiz boolean alanı.')
  }

  return value
}

export function assertSaveProfileRequest(input: unknown): SaveProfileRequest {
  const value = assertObject(input, 'profil isteği')
  const authType = assertAuthType(value.authType)

  const request: SaveProfileRequest = {
    id: assertOptionalString(value.id),
    name: assertNonEmptyString(value.name, 'Profil adı'),
    host: assertNonEmptyString(value.host, 'Sunucu adresi'),
    port: assertPort(value.port),
    username: assertNonEmptyString(value.username, 'Kullanıcı adı'),
    authType,
    privateKeyPath: assertOptionalString(value.privateKeyPath),
    savePassword: assertBoolean(value.savePassword, false),
    savePassphrase: assertBoolean(value.savePassphrase, false),
    password: assertOptionalString(value.password),
    passphrase: assertOptionalString(value.passphrase),
  }

  if (authType === 'privateKey' && !request.privateKeyPath) {
    throw new IpcValidationError('Özel anahtar dosyası seçilmeli.')
  }

  if (authType === 'password' && request.savePassword && !request.password && !request.id) {
    throw new IpcValidationError('Parola kaydetmek için parola girilmeli.')
  }

  if (authType === 'privateKey' && request.savePassphrase && !request.passphrase && !request.id) {
    throw new IpcValidationError('Passphrase kaydetmek için passphrase girilmeli.')
  }

  return request
}

export function assertProfileId(input: unknown): string {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new IpcValidationError('Geçersiz profil kimliği.')
  }

  return input.trim()
}
