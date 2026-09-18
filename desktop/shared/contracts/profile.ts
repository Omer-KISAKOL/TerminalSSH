import type { AuthType } from '@shared/contracts/ssh'

export interface ServerProfile {
  id: string
  name: string
  host: string
  port: number
  username: string
  authType: AuthType
  privateKeyPath?: string
  privateKeyContent?: string
  savePassword: boolean
  savePassphrase: boolean
  encryptedPassword?: string
  encryptedPassphrase?: string
  encryptedPrivateKey?: string
  lastConnectedAt?: string
  createdAt: string
  updatedAt: string
  syncSource?: 'local' | 'cloud'
}

export interface PublicServerProfile {
  id: string
  name: string
  host: string
  port: number
  username: string
  authType: AuthType
  privateKeyPath?: string
  savePassword: boolean
  savePassphrase: boolean
  hasSavedPassword: boolean
  hasSavedPassphrase: boolean
  hasSavedPrivateKey: boolean
  lastConnectedAt?: string
  createdAt: string
  updatedAt: string
  syncSource?: 'local' | 'cloud'
}

export interface SaveProfileRequest {
  id?: string
  name: string
  host: string
  port: number
  username: string
  authType: AuthType
  privateKeyPath?: string
  privateKeyContent?: string
  savePassword: boolean
  savePassphrase: boolean
  password?: string
  passphrase?: string
}

export interface ProfileMigrationCandidate {
  id: string
  name: string
  host: string
  port: number
  username: string
}

export interface ProfileExportEntry {
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
}

export interface ProfileExportBundle {
  version: 1
  kind: 'terminalssh-profiles'
  exportedAt: string
  includeSecrets: boolean
  profiles: ProfileExportEntry[]
}

export type ProfileExportResult =
  | { canceled: true }
  | { canceled: false; path: string; count: number }

export type ProfileImportResult =
  | { canceled: true }
  | { canceled: false; count: number }
