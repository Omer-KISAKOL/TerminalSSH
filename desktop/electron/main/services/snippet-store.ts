import { randomUUID } from 'node:crypto'

import Store from 'electron-store'

import type { SaveSnippetRequest, Snippet } from '@shared/contracts/snippet'

interface SnippetStoreSchema {
  snippets: Snippet[]
}

export class SnippetStore {
  private readonly store = new Store<SnippetStoreSchema>({
    name: 'terminalssh-snippets',
    defaults: {
      snippets: [],
    },
  })

  list(): Snippet[] {
    return [...this.store.get('snippets')].sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder
      }

      return left.name.localeCompare(right.name, 'tr')
    })
  }

  save(request: SaveSnippetRequest): Snippet {
    const now = new Date().toISOString()
    const snippets = this.store.get('snippets')
    const existingIndex = request.id
      ? snippets.findIndex((snippet) => snippet.id === request.id)
      : -1

    const snippet: Snippet = {
      id: request.id ?? randomUUID(),
      name: request.name,
      content: request.content,
      sortOrder:
        request.sortOrder ??
        (existingIndex >= 0 ? snippets[existingIndex]!.sortOrder : snippets.length),
      createdAt: existingIndex >= 0 ? snippets[existingIndex]!.createdAt : now,
      updatedAt: now,
    }

    if (existingIndex >= 0) {
      snippets[existingIndex] = snippet
    } else {
      snippets.push(snippet)
    }

    this.store.set('snippets', snippets)
    return snippet
  }

  remove(snippetId: string): void {
    this.store.set(
      'snippets',
      this.store.get('snippets').filter((snippet) => snippet.id !== snippetId),
    )
  }
}

export const snippetStore = new SnippetStore()
