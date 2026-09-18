import { describe, expect, it } from 'vitest'

import { assertHostVerifyResponse } from '../host'
import { IpcValidationError } from '../ssh'

describe('assertHostVerifyResponse', () => {
  it('geçerli yanıtı kabul eder', () => {
    expect(assertHostVerifyResponse({ verificationId: 'verify-1', approved: true })).toEqual({
      verificationId: 'verify-1',
      approved: true,
    })
  })

  it('geçersiz alanları reddeder', () => {
    expect(() => assertHostVerifyResponse({ verificationId: '', approved: true })).toThrow(
      IpcValidationError,
    )
    expect(() => assertHostVerifyResponse({ verificationId: 'verify-1', approved: 'yes' })).toThrow(
      IpcValidationError,
    )
  })
})
