import type { SaveSnippetRequest } from '@shared/contracts/snippet'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function assertSnippetId(snippetId: string): string {
  if (!UUID_PATTERN.test(snippetId)) {
    throw new Error('Geçersiz snippet kimliği.')
  }

  return snippetId
}

export function assertSaveSnippetRequest(input: unknown): SaveSnippetRequest {
  if (!input || typeof input !== 'object') {
    throw new Error('Geçersiz snippet isteği.')
  }

  const value = input as Partial<SaveSnippetRequest>

  if (!value.name || value.name.trim().length === 0) {
    throw new Error('Snippet adı gerekli.')
  }

  if (typeof value.content !== 'string') {
    throw new Error('Snippet içeriği gerekli.')
  }

  if (value.id && !UUID_PATTERN.test(value.id)) {
    throw new Error('Geçersiz snippet kimliği.')
  }

  return {
    id: value.id,
    name: value.name.trim(),
    content: value.content,
    sortOrder: value.sortOrder,
  }
}
