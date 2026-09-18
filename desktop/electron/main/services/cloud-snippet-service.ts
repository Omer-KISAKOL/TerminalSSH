import { TerminalSshApiClient } from '@terminalssh/api-client'
import type { CloudSnippet, SaveCloudSnippetInput } from '@terminalssh/api-client'

import type { SaveSnippetRequest, Snippet } from '@shared/contracts/snippet'

import { resolveApiBaseUrl } from '@shared/constants/api'

import { authStore } from './auth-store'

function getApiClient(): TerminalSshApiClient {
  return new TerminalSshApiClient({
    baseUrl: resolveApiBaseUrl(),
    getAccessToken: () => authStore.getSession()?.accessToken ?? null,
    getRefreshToken: () => authStore.getSession()?.refreshToken ?? null,
    onSessionUpdate: (session) => {
      authStore.setSession(session)
    },
  })
}

function toSnippet(snippet: CloudSnippet): Snippet {
  return {
    id: snippet.id,
    name: snippet.name,
    content: snippet.content,
    sortOrder: snippet.sortOrder,
    createdAt: snippet.createdAt,
    updatedAt: snippet.updatedAt,
  }
}

function toSaveInput(request: SaveSnippetRequest): SaveCloudSnippetInput {
  return {
    id: request.id,
    name: request.name,
    content: request.content,
    sortOrder: request.sortOrder,
  }
}

export const cloudSnippetService = {
  async list(): Promise<Snippet[]> {
    const response = await getApiClient().listSnippets()
    return response.snippets.map(toSnippet)
  },

  async save(request: SaveSnippetRequest): Promise<Snippet> {
    const input = toSaveInput(request)

    if (request.id) {
      const response = await getApiClient().updateSnippet(request.id, input)
      return toSnippet(response.snippet)
    }

    const response = await getApiClient().createSnippet(input)
    return toSnippet(response.snippet)
  },

  async remove(snippetId: string): Promise<void> {
    await getApiClient().deleteSnippet(snippetId)
  },
}
