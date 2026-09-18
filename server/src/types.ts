export type AuthType = 'password' | 'privateKey'

export interface UserRow {
  id: string
  email: string
  password_hash: string
  encrypted_data_key: string
  created_at: Date
  updated_at: Date
}

export interface ProfileRow {
  id: string
  user_id: string
  name: string
  host: string
  port: number
  username: string
  auth_type: AuthType
  save_password: boolean
  save_passphrase: boolean
  encrypted_password: string | null
  encrypted_passphrase: string | null
  encrypted_private_key: string | null
  last_connected_at: Date | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}

export interface SyncProfileInput {
  id: string
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
  updatedAt: string
  deletedAt?: string | null
}

export interface ProfileResponse {
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
