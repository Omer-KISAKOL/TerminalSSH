import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

import { config } from '../config.js'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function encodePayload(iv: Buffer, authTag: Buffer, ciphertext: Buffer): string {
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64')
}

function decodePayload(payload: string): { iv: Buffer; authTag: Buffer; ciphertext: Buffer } {
  const buffer = Buffer.from(payload, 'base64')
  const iv = buffer.subarray(0, IV_LENGTH)
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16)
  const ciphertext = buffer.subarray(IV_LENGTH + 16)

  return { iv, authTag, ciphertext }
}

function encryptWithKey(key: Buffer, plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return encodePayload(iv, authTag, ciphertext)
}

function decryptWithKey(key: Buffer, payload: string): string {
  const { iv, authTag, ciphertext } = decodePayload(payload)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])

  return plaintext.toString('utf8')
}

export function generateDataKey(): Buffer {
  return randomBytes(32)
}

export function encryptDataKey(dataKey: Buffer): string {
  return encryptWithKey(config.serverMasterKey, dataKey.toString('base64'))
}

export function decryptDataKey(encryptedDataKey: string): Buffer {
  const decoded = decryptWithKey(config.serverMasterKey, encryptedDataKey)
  return Buffer.from(decoded, 'base64')
}

export function encryptSecret(dataKey: Buffer, value: string): string {
  return encryptWithKey(dataKey, value)
}

export function decryptSecret(dataKey: Buffer, payload: string | null | undefined): string | null {
  if (!payload) {
    return null
  }

  return decryptWithKey(dataKey, payload)
}
