import { describe, expect, it } from 'vitest'

import { MAX_PORT, MIN_PORT } from '@shared/constants/validation'

import { DEFAULT_CONNECTION_FORM, validateConnectionForm } from '../connection-form'

describe('validateConnectionForm', () => {
  it('geçerli parola bağlantısını kabul eder', () => {
    expect(
      validateConnectionForm({
        ...DEFAULT_CONNECTION_FORM,
        host: 'example.com',
        port: '22',
        username: 'user',
        password: 'secret',
      }),
    ).toBeNull()
  })

  it('port sınırlarını doğrular', () => {
    expect(
      validateConnectionForm({
        ...DEFAULT_CONNECTION_FORM,
        host: 'example.com',
        port: String(MIN_PORT - 1),
        username: 'user',
        password: 'secret',
      }),
    ).toContain(String(MIN_PORT))

    expect(
      validateConnectionForm({
        ...DEFAULT_CONNECTION_FORM,
        host: 'example.com',
        port: String(MAX_PORT + 1),
        username: 'user',
        password: 'secret',
      }),
    ).toContain(String(MAX_PORT))
  })

  it('sayısal olmayan portu reddeder', () => {
    expect(
      validateConnectionForm({
        ...DEFAULT_CONNECTION_FORM,
        host: 'example.com',
        port: 'abc',
        username: 'user',
        password: 'secret',
      }),
    ).toBe('Port geçerli bir sayı olmalı.')
  })
})
