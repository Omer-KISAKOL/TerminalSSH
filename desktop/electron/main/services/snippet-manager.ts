import type { SaveSnippetRequest, Snippet } from '@shared/contracts/snippet'

import { authStore } from './auth-store'
import { cloudSnippetService } from './cloud-snippet-service'
import { snippetStore } from './snippet-store'

class SnippetManager {
  private isCloudMode(): boolean {
    return authStore.isAuthenticated()
  }

  list(): Promise<Snippet[]> {
    if (this.isCloudMode()) {
      return cloudSnippetService.list()
    }

    return Promise.resolve(snippetStore.list())
  }

  save(request: SaveSnippetRequest): Promise<Snippet> {
    if (this.isCloudMode()) {
      return cloudSnippetService.save(request)
    }

    return Promise.resolve(snippetStore.save(request))
  }

  remove(snippetId: string): Promise<void> {
    if (this.isCloudMode()) {
      return cloudSnippetService.remove(snippetId)
    }

    snippetStore.remove(snippetId)
    return Promise.resolve()
  }
}

export const snippetManager = new SnippetManager()
