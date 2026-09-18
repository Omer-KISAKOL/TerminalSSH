import type { SftpConnectRequest } from '@shared/contracts/sftp'
import type { ConnectRequest, ConnectionFormValues } from '@shared/contracts/ssh'
import type { SftpWorkspaceTab, TerminalWorkspaceTab, WorkspaceTab } from '@shared/contracts/workspace'

import { getConnectionLabel } from '@/lib/connection-form'

export function createTabId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export function formValuesToConnectRequest(
  values: ConnectionFormValues,
  cols: number,
  rows: number,
): ConnectRequest {
  return {
    profileId: values.profileId,
    host: values.host.trim(),
    port: Number.parseInt(values.port, 10),
    username: values.username.trim(),
    authType: values.authType,
    password: values.authType === 'password' ? values.password || undefined : undefined,
    privateKeyPath:
      values.authType === 'privateKey' ? values.privateKeyPath || undefined : undefined,
    passphrase: values.authType === 'privateKey' ? values.passphrase || undefined : undefined,
    cols,
    rows,
  }
}

export function formValuesToSftpRequest(values: ConnectionFormValues): SftpConnectRequest {
  return {
    profileId: values.profileId,
    host: values.host.trim(),
    port: Number.parseInt(values.port, 10),
    username: values.username.trim(),
    authType: values.authType,
    password: values.authType === 'password' ? values.password || undefined : undefined,
    privateKeyPath:
      values.authType === 'privateKey' ? values.privateKeyPath || undefined : undefined,
    passphrase: values.authType === 'privateKey' ? values.passphrase || undefined : undefined,
  }
}

export function createTerminalTab(label = 'Yeni Terminal'): TerminalWorkspaceTab {
  return {
    id: createTabId('terminal'),
    type: 'terminal',
    label,
    sessionId: null,
    status: 'idle',
    errorMessage: null,
    connectValues: null,
  }
}

export function createSftpTab(label = 'SFTP'): SftpWorkspaceTab {
  return {
    id: createTabId('sftp'),
    type: 'sftp',
    label,
    sessionId: null,
    status: 'idle',
    errorMessage: null,
    connectValues: null,
    localPath: '',
    remotePath: '/',
    connected: false,
  }
}

export function getTabLabel(values: ConnectionFormValues, type: WorkspaceTab['type']): string {
  const base = getConnectionLabel(values)
  return type === 'sftp' ? `SFTP · ${base}` : base
}
