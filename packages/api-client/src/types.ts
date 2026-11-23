export type AuthType = 'password' | 'privateKey'

export interface AuthUser {
  id: string
  email: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface AuthMeResponse {
  user: AuthUser
  requiresSecuritySetup: boolean
}

export interface LoginPendingSecuritySetup {
  requiresSecuritySetup: true
  setupToken: string
  user: AuthUser
}

export type LoginResponse = AuthSession | LoginPendingSecuritySetup

export interface SecuritySetupWithTokenInput {
  setupToken: string
  securityQuestionId: string
  securityAnswer: string
  deviceName?: string
}

export interface SecuritySetupAuthenticatedInput {
  securityQuestionId: string
  securityAnswer: string
}

export interface RegisterAccountInput {
  email: string
  password: string
  securityQuestionId: string
  securityAnswer: string
  deviceName?: string
}

export interface CloudProfile {
  id: string
  name: string
  host: string
  port: number
  username: string
  authType: AuthType
  savePassword: boolean
  savePassphrase: boolean
  hasSavedPassword: boolean
  hasSavedPassphrase: boolean
  hasSavedPrivateKey: boolean
  password?: string | null
  passphrase?: string | null
  privateKey?: string | null
  lastConnectedAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface SaveCloudProfileInput {
  id?: string
  name: string
  host: string
  port: number
  username: string
  authType: AuthType
  savePassword: boolean
  savePassphrase: boolean
  password?: string | null
  passphrase?: string | null
  privateKey?: string | null
  lastConnectedAt?: string | null
}

export interface SyncCloudProfileInput extends SaveCloudProfileInput {
  id: string
  updatedAt: string
  deletedAt?: string | null
}

export interface CloudSnippet {
  id: string
  name: string
  content: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface SaveCloudSnippetInput {
  id?: string
  name: string
  content: string
  sortOrder?: number
}

export interface ReleaseCheckResponse {
  updateAvailable: boolean
  currentVersion: string
  latestVersion: string | null
  downloadUrl: string | null
  releaseNotes: string | null
  phase?: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'
  percent?: number | null
  nativeAutoUpdate?: boolean
  errorMessage?: string | null
}

export class ApiClientError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'ApiClientError'
    this.statusCode = statusCode
  }
}
