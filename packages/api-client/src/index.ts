import { ApiClientError } from './types.js'
import type {
  AuthMeResponse,
  AuthSession,
  CloudProfile,
  CloudSnippet,
  LoginResponse,
  RegisterAccountInput,
  SaveCloudProfileInput,
  SaveCloudSnippetInput,
  SecuritySetupAuthenticatedInput,
  SecuritySetupWithTokenInput,
  SyncCloudProfileInput,
  ReleaseCheckResponse,
} from './types.js'

export type {
  AuthMeResponse,
  AuthSession,
  AuthUser,
  AuthType,
  CloudProfile,
  CloudSnippet,
  LoginResponse,
  RegisterAccountInput,
  SaveCloudProfileInput,
  SaveCloudSnippetInput,
  SecuritySetupAuthenticatedInput,
  SecuritySetupWithTokenInput,
  SyncCloudProfileInput,
  ReleaseCheckResponse,
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
  let payload: (T & { error?: string; message?: string }) | null = null

  try {
    payload = (await response.json()) as T & { error?: string; message?: string }
  } catch {
    if (!response.ok) {
      throw new ApiClientError(
        response.status === 429
          ? 'Çok fazla istek gönderildi. Lütfen kısa bir süre bekleyin.'
          : `API isteği başarısız (HTTP ${response.status}).`,
        response.status,
      )
    }

    throw new ApiClientError('API yanıtı okunamadı.', response.status)
  }

  if (!response.ok) {
    const detail = [payload.message, payload.error]
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .find((value) => value.length > 0)

    throw new ApiClientError(
      detail ??
        (response.status === 503
          ? 'Sunucu geçici olarak kullanılamıyor. Veritabanı veya API hazır değil.'
          : 'API isteği başarısız.'),
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

    if (init.body != null) {
      headers.set('Content-Type', 'application/json')
    }

    const accessToken = this.getAccessToken ? await this.getAccessToken() : null

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`)
    }

    let response: Response

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
      })
    } catch {
      throw new ApiClientError(
        'API sunucusuna ulaşılamıyor. Bağlantı ve sunucunun çalıştığını kontrol edin.',
        0,
      )
    }

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

  register(input: RegisterAccountInput) {
    return this.request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        securityQuestionId: input.securityQuestionId,
        securityAnswer: input.securityAnswer,
        deviceName: input.deviceName,
      }),
    })
  }

  getPasswordResetQuestion(email: string) {
    return this.request<{ securityQuestionId: string }>('/auth/password-reset/question', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  resetPasswordWithSecurityAnswer(email: string, securityAnswer: string, newPassword: string) {
    return this.request<{ ok: boolean }>('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ email, securityAnswer, newPassword }),
    })
  }

  login(email: string, password: string, deviceName?: string) {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, deviceName }),
    })
  }

  completeSecuritySetupWithToken(input: SecuritySetupWithTokenInput) {
    return this.request<AuthSession>('/auth/security-setup', {
      method: 'POST',
      body: JSON.stringify({
        setupToken: input.setupToken,
        securityQuestionId: input.securityQuestionId,
        securityAnswer: input.securityAnswer,
        deviceName: input.deviceName,
      }),
    })
  }

  completeSecuritySetupAuthenticated(input: SecuritySetupAuthenticatedInput) {
    return this.request<{ ok: boolean }>('/auth/security-setup/complete', {
      method: 'POST',
      body: JSON.stringify(input),
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
    return this.request<AuthMeResponse>('/auth/me')
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

  listSnippets() {
    return this.request<{ snippets: CloudSnippet[] }>('/snippets')
  }

  createSnippet(input: SaveCloudSnippetInput) {
    return this.request<{ snippet: CloudSnippet }>('/snippets', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  }

  updateSnippet(snippetId: string, input: Partial<SaveCloudSnippetInput>) {
    return this.request<{ snippet: CloudSnippet }>(`/snippets/${snippetId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  }

  deleteSnippet(snippetId: string) {
    return this.request<{ ok: boolean }>(`/snippets/${snippetId}`, {
      method: 'DELETE',
    })
  }

  checkForUpdate(platform: string, currentVersion: string) {
    const query = new URLSearchParams({
      platform,
      current: currentVersion,
    })

    return this.request<ReleaseCheckResponse>(`/releases/check?${query.toString()}`)
  }
}
