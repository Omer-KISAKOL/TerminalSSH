import type { IpcMainInvokeEvent } from 'electron'

import { IpcValidationError } from '@shared/validation/ssh'

export function handleIpcError(error: unknown): never {
  if (error instanceof IpcValidationError) {
    throw new Error(error.message)
  }

  if (error instanceof Error) {
    throw error
  }

  throw new Error('İşlem tamamlanamadı.')
}

export function createIpcHandler<TInput, TResult>(
  validate: (input: unknown) => TInput,
  handler: (event: IpcMainInvokeEvent, payload: TInput) => TResult | Promise<TResult>,
) {
  return async (event: IpcMainInvokeEvent, input: unknown): Promise<TResult> => {
    try {
      const payload = validate(input)
      return await handler(event, payload)
    } catch (error) {
      handleIpcError(error)
    }
  }
}

export function createIpcVoidHandler<TInput>(
  validate: (input: unknown) => TInput,
  handler: (event: IpcMainInvokeEvent, payload: TInput) => void | Promise<void>,
) {
  return async (event: IpcMainInvokeEvent, input: unknown): Promise<void> => {
    try {
      const payload = validate(input)
      await handler(event, payload)
    } catch (error) {
      handleIpcError(error)
    }
  }
}
