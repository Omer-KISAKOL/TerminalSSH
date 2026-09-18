import { TerminalSshApiClient } from '@terminalssh/api-client'
import type { CloudSnippet, SaveCloudSnippetInput } from '@terminalssh/api-client'

import type { ProfileSnippet, SaveSnippetRequest } from '@shared/contracts/snippet'

import { authStore } from './auth-store'

function getApiClient(): TerminalSshApiClient {
  return new TerminalSshApiClient({
    baseUrl: process.env.TERMINALSSH_API_URL ?? 'http://localhost:8787',
    getAccessToken: () => authStore.getSession()?.accessToken ?? null,
    getRefreshToken: () => authStore.getSession()?.refreshToken ?? null,
    onSessionUpdate: (session) => {
      authStore.setSession(session)
    },
  })
}

function toProfileSnippet(snippet: CloudSnippet): ProfileSnippet {
  return {
    id: snippet.id,
    profileId: snippet.profileId,
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
  async list(profileId: string): Promise<ProfileSnippet[]> {
    const response = await getApiClient().listSnippets(profileId)
    return response.snippets.map(toProfileSnippet)
  },

  async save(profileId: string, request: SaveSnippetRequest): Promise<ProfileSnippet> {
    const input = toSaveInput(request)

    if (request.id) {
      const response = await getApiClient().updateSnippet(profileId, request.id, input)
      return toProfileSnippet(response.snippet)
    }

    const response = await getApiClient().createSnippet(profileId, input)
    return toProfileSnippet(response.snippet)
  },

  async remove(profileId: string, snippetId: string): Promise<void> {
    await getApiClient().deleteSnippet(profileId, snippetId)
  },
}
