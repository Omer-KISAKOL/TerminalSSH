import type { MessageKey, Messages } from '@/lib/i18n/catalog'

type Params = Record<string, string | number>

function resolvePath(messages: Messages, key: string): string | undefined {
  const parts = key.split('.')
  let value: unknown = messages

  for (const part of parts) {
    if (typeof value !== 'object' || value === null || !(part in value)) {
      return undefined
    }

    value = (value as Record<string, unknown>)[part]
  }

  return typeof value === 'string' ? value : undefined
}

export function createTranslator(messages: Messages) {
  return function t(key: MessageKey | string, params?: Params): string {
    const template = resolvePath(messages, key) ?? key

    if (!params) {
      return template
    }

    return template.replace(/\{(\w+)\}/g, (_, token: string) => {
      const value = params[token]
      return value === undefined ? `{${token}}` : String(value)
    })
  }
}

export type Translator = ReturnType<typeof createTranslator>