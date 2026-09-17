import { describe, expect, it } from 'vitest'

import { SSH_ERROR_MESSAGES } from '@shared/errors/ssh-messages'

import { mapSshError } from '../ssh-errors'

describe('mapSshError', () => {
  it('oturum nedeni varsa öncelik verir', () => {
    expect(mapSshError({ code: 'ETIMEDOUT' }, SSH_ERROR_MESSAGES.FINGERPRINT_MISMATCH)).toBe(
      SSH_ERROR_MESSAGES.FINGERPRINT_MISMATCH,
    )
  })

  it('DNS hatalarını eşler', () => {
    expect(mapSshError({ code: 'ENOTFOUND' })).toBe(SSH_ERROR_MESSAGES.DNS_ERROR)
    expect(mapSshError({ message: 'getaddrinfo ENOTFOUND example.com' })).toBe(
      SSH_ERROR_MESSAGES.DNS_ERROR,
    )
  })

  it('bağlantı reddi ve zaman aşımını eşler', () => {
    expect(mapSshError({ code: 'ECONNREFUSED' })).toBe(SSH_ERROR_MESSAGES.CONNECTION_REFUSED)
    expect(mapSshError({ code: 'ETIMEDOUT' })).toBe(SSH_ERROR_MESSAGES.TIMEOUT)
  })

  it('kimlik doğrulama hatalarını eşler', () => {
    expect(mapSshError({ message: 'Authentication failed' })).toBe(SSH_ERROR_MESSAGES.AUTH_FAILED)
  })

  it('özel anahtar hatalarını eşler', () => {
    expect(mapSshError({ message: 'Cannot parse privateKey' })).toBe(
      SSH_ERROR_MESSAGES.PRIVATE_KEY_ERROR,
    )
  })

  it('host reddini eşler', () => {
    expect(mapSshError({ message: 'Host denied' })).toBe(SSH_ERROR_MESSAGES.HOST_REJECTED)
  })
})
