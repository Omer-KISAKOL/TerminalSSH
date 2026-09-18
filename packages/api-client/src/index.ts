import { ApiClientError } from './types.js'
import type {
  AuthSession,
  AuthUser,
  CloudProfile,
  CloudSnippet,
  SaveCloudProfileInput,
  SaveCloudSnippetInput,
  SyncCloudProfileInput,
} from './types.js'

export type {
  AuthSession,
  AuthUser,
  AuthType,
  CloudProfile,
  CloudSnippet,
  SaveCloudProfileInput,
  SaveCloudSnippetInput,
  SyncCloudProfileInput,
} from './types.js'
export { ApiClientError } from './types.js'

type TokenProvider = () => Promise<string | null> | string | null

export interface ApiClientOptions {
  baseUrl: string
  getAccessToken?: TokenProvider
  getRefreshToken?: TokenProvider
  onSessionUpdate?: (session: AuthSession) => void | Promise<void>
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string; message?: string }

  if (!response.ok) {
    throw new ApiClientError(
      payload.message ?? payload.error ?? 'API isteği başarısız.',
      response.status,
    )
  }

  return payload
}

export class TerminalSshApiClient {
  private readonly baseUrl: string
  private readonly getAccessToken?: TokenProvider
  private readonly getRefreshToken?: TokenProvider
  private readonly onSessionUpdate?: (session: AuthSession) => void | Promise<void>

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.getAccessToken = options.getAccessToken
    this.getRefreshToken = options.getRefreshToken
    this.onSessionUpdate = options.onSessionUpdate
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    retryOnUnauthorized = true,
  ): Promise<T> {
    const headers = new Headers(init.headers)
    headers.set('Content-Type', 'application/json')

    const accessToken = this.getAccessToken ? await this.getAccessToken() : null

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    })

    if (response.status === 401 && retryOnUnauthorized && this.getRefreshToken) {
      const refreshToken = await this.getRefreshToken()

      if (refreshToken) {
        const session = await this.refresh(refreshToken)
        await this.onSessionUpdate?.(session)
        return this.request<T>(path, init, false)
      }
    }

    return parseJson<T>(response)
  }

  register(email: string, password: string, deviceName?: string) {
    return this.request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, deviceName }),
    })
  }

  login(email: string, password: string, deviceName?: string) {
    return this.request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, deviceName }),
    })
  }

  refresh(refreshToken: string) {
    return this.request<AuthSession>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  }

  logout(refreshToken: string) {
    return this.request<{ ok: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  }

  me() {
    return this.request<{ user: AuthUser }>('/auth/me')
  }

  listProfiles() {
    return this.request<{ profiles: CloudProfile[] }>('/profiles')
  }

  createProfile(input: SaveCloudProfileInput) {
    return this.request<{ profile: CloudProfile }>('/profiles', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  updateProfile(id: string, input: Partial<SaveCloudProfileInput>) {
    return this.request<{ profile: CloudProfile }>(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  }

  deleteProfile(id: string) {
    return this.request<{ ok: boolean }>(`/profiles/${id}`, {
      method: 'DELETE',
    })
  }

  syncProfiles(profiles: SyncCloudProfileInput[]) {
    return this.request<{ profiles: CloudProfile[] }>('/profiles/sync', {
      method: 'POST',
      body: JSON.stringify({ profiles }),
    })
  }

  markConnected(id: string) {
    return this.request<{ ok: boolean }>(`/profiles/${id}/connected`, {
      method: 'POST',
    })
  }

  listSnippets(profileId: string) {
    return this.request<{ snippets: CloudSnippet[] }>(`/profiles/${profileId}/snippets`)
  }

  createSnippet(profileId: string, input: SaveCloudSnippetInput) {
    return this.request<{ snippet: CloudSnippet }>(`/profiles/${profileId}/snippets`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  updateSnippet(profileId: string, snippetId: string, input: Partial<SaveCloudSnippetInput>) {
    return this.request<{ snippet: CloudSnippet }>(`/profiles/${profileId}/snippets/${snippetId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  }

  deleteSnippet(profileId: string, snippetId: string) {
    return this.request<{ ok: boolean }>(`/profiles/${profileId}/snippets/${snippetId}`, {
      method: 'DELETE',
    })
  }
}
