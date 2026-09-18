import type { ConnectionStatus } from '@shared/contracts/ssh'

export type FileEntryKind = 'file' | 'directory' | 'symlink'

export interface FileEntry {
  name: string
  path: string
  kind: FileEntryKind
  size: number | null
  modifiedAt: string | null
  permissions: string | null
}

export interface SftpConnectRequest {
  profileId?: string
  host: string
  port: number
  username: string
  authType: 'password' | 'privateKey'
  password?: string
  privateKeyPath?: string
  passphrase?: string
}

export interface SftpConnectResponse {
  sessionId: string
}

export interface SftpStatusEvent {
  sessionId: string
  status: ConnectionStatus
  message?: string
}

export interface SftpListDirRequest {
  sessionId: string
  path: string
}

export interface SftpTransferRequest {
  sessionId: string
  localPath: string
  remotePath: string
}
