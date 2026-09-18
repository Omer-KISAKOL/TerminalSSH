import type { ConnectionFormValues, ConnectionStatus } from '@shared/contracts/ssh'

export type WorkspaceTabType = 'terminal' | 'sftp'

export interface WorkspaceTabBase {
  id: string
  type: WorkspaceTabType
  label: string
  sessionId: string | null
  status: ConnectionStatus
  errorMessage: string | null
  connectValues: ConnectionFormValues | null
}

export interface TerminalWorkspaceTab extends WorkspaceTabBase {
  type: 'terminal'
}

export interface SftpWorkspaceTab extends WorkspaceTabBase {
  type: 'sftp'
  localPath: string
  remotePath: string
  connected: boolean
}

export type WorkspaceTab = TerminalWorkspaceTab | SftpWorkspaceTab
