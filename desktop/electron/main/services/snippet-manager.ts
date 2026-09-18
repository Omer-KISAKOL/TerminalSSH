import type { ProfileSnippet, SaveSnippetRequest } from '@shared/contracts/snippet'

import { authStore } from './auth-store'
import { cloudSnippetService } from './cloud-snippet-service'
import { snippetStore } from './snippet-store'

class SnippetManager {
  private isCloudMode(): boolean {
    return authStore.isAuthenticated()
  }

  list(profileId: string): Promise<ProfileSnippet[]> {
    if (this.isCloudMode()) {
      return cloudSnippetService.list(profileId)
    }

    return Promise.resolve(snippetStore.list(profileId))
  }

  save(request: SaveSnippetRequest): Promise<ProfileSnippet> {
    if (this.isCloudMode()) {
      return cloudSnippetService.save(request.profileId, request)
    }

    return Promise.resolve(snippetStore.save(request))
  }

  remove(profileId: string, snippetId: string): Promise<void> {
    if (this.isCloudMode()) {
      return cloudSnippetService.remove(profileId, snippetId)
    }

    snippetStore.remove(profileId, snippetId)
    return Promise.resolve()
  }
}

export const snippetManager = new SnippetManager()
