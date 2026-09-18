import type { HostVerifyResponse } from '@shared/contracts/host'

import { IpcValidationError } from '@shared/validation/ssh'

function assertObject(input: unknown, label: string): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new IpcValidationError(`Geçersiz ${label}.`)
  }

  return input as Record<string, unknown>
}

export function assertHostVerifyResponse(input: unknown): HostVerifyResponse {
  const value = assertObject(input, 'host doğrulama yanıtı')

  if (typeof value.verificationId !== 'string' || value.verificationId.trim().length === 0) {
    throw new IpcValidationError('Geçersiz doğrulama kimliği.')
  }

  if (typeof value.approved !== 'boolean') {
    throw new IpcValidationError('Geçersiz onay değeri.')
  }

  return {
    verificationId: value.verificationId.trim(),
    approved: value.approved,
  }
}
