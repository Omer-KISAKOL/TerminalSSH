import type { AuthType } from '@shared/contracts/ssh'

export interface ServerProfile {
  id: string
  name: string
  host: string
  port: number
  username: string
  authType: AuthType
  privateKeyPath?: string
  savePassword: boolean
  savePassphrase: boolean
  encryptedPassword?: string
  encryptedPassphrase?: string
  lastConnectedAt?: string
  createdAt: string
  updatedAt: string
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
  lastConnectedAt?: string
  createdAt: string
  updatedAt: string
}

export interface SaveProfileRequest {
  id?: string
  name: string
  host: string
  port: number
  username: string
  authType: AuthType
  privateKeyPath?: string
  savePassword: boolean
  savePassphrase: boolean
  password?: string
  passphrase?: string
}
