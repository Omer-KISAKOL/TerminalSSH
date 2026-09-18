import { beforeAll, describe, expect, it } from 'vitest'

process.env.DATABASE_URL = 'postgresql://terminalssh:terminalssh@localhost:5432/terminalssh'
process.env.JWT_SECRET = 'test-secret'
process.env.SERVER_MASTER_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

const { decryptSecret, encryptSecret, encryptDataKey, decryptDataKey, generateDataKey } =
  await import('../crypto-service.js')

describe('crypto-service', () => {
  let dataKey: Buffer

  beforeAll(() => {
    dataKey = generateDataKey()
  })

  it('encrypts and decrypts secrets', () => {
    const encrypted = encryptSecret(dataKey, 'super-secret')
    expect(decryptSecret(dataKey, encrypted)).toBe('super-secret')
  })

  it('encrypts and decrypts data keys with master key', () => {
    const wrapped = encryptDataKey(dataKey)
    const unwrapped = decryptDataKey(wrapped)
    expect(unwrapped.equals(dataKey)).toBe(true)
  })
})
