import type { IpcMainInvokeEvent } from 'electron'

import { ApiClientError } from '@terminalssh/api-client'
import { IpcValidationError } from '@shared/validation/ssh'

function toIpcError(error: unknown): Error {
  if (error instanceof IpcValidationError) {
    return new Error(error.message)
  }

  if (error instanceof ApiClientError) {
    if (error.statusCode === 429) {
      return new Error(
        error.message.includes('Rate limit')
          ? `${error.message} Bir süre bekleyip tekrar deneyin.`
          : 'Çok fazla istek gönderildi. Yaklaşık bir dakika bekleyip tekrar deneyin.',
      )
    }

    const message = error.message.trim()
    return new Error(message || 'API isteği başarısız.')
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (
      message.includes('fetch failed') ||
      message.includes('econnrefused') ||
      message.includes('network') ||
      message.includes('enotfound')
    ) {
      return new Error(
        'API sunucusuna bağlanılamadı. Docker Desktop ve `pnpm dev:server` çalışıyor mu?',
      )
    }

    const message = error.message.trim()
    return new Error(message || 'İşlem tamamlanamadı.')
  }

  return new Error('İşlem tamamlanamadı.')
}

export function handleIpcError(error: unknown): never {
  throw toIpcError(error)
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
