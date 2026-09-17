export type AuthType = 'password' | 'privateKey'

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected'
  | 'error'

export interface ConnectRequest {
  profileId?: string
  host: string
  port: number
  username: string
  authType: AuthType
  password?: string
  privateKeyPath?: string
  passphrase?: string
  cols: number
  rows: number
}

export interface ConnectResponse {
  sessionId: string
}

export interface SshDataEvent {
  sessionId: string
  data: string
}

export interface SshStatusEvent {
  sessionId: string
  status: ConnectionStatus
  message?: string
}

export interface ConnectionFormValues {
  profileId?: string
  name: string
  host: string
  port: string
  username: string
  authType: AuthType
  password: string
  privateKeyPath: string
  passphrase: string
  savePassword: boolean
  savePassphrase: boolean
  saveProfile: boolean
  hasSavedPassword: boolean
  hasSavedPassphrase: boolean
}
