import { safeStorage } from 'electron'

export class SecretStoreError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SecretStoreError'
  }
}

export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

export function assertCanStoreSecrets(): void {
  if (!isEncryptionAvailable()) {
    throw new SecretStoreError('Güvenli şifreleme kullanılamıyor. Hassas bilgiler kaydedilemedi.')
  }
}

export function encryptSecret(value: string): string {
  assertCanStoreSecrets()
  return safeStorage.encryptString(value).toString('base64')
}

export function decryptSecret(encryptedValue: string): string {
  assertCanStoreSecrets()
  return safeStorage.decryptString(Buffer.from(encryptedValue, 'base64'))
}
