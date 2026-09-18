import type { AuthUser } from '@shared/contracts/auth'
import type { HostVerifyRequestEvent } from '@shared/contracts/host'
import type { ProfileMigrationCandidate } from '@shared/contracts/profile'
import type { PublicServerProfile, SaveProfileRequest } from '@shared/contracts/profile'
import type {
  FileEntry,
  SftpConnectRequest,
  SftpConnectResponse,
  SftpStatusEvent,
} from '@shared/contracts/sftp'
import type {
  ConnectRequest,
  ConnectResponse,
  SshDataEvent,
  SshStatusEvent,
} from '@shared/contracts/ssh'

export interface DesktopApi {
  app: {
    getVersion(): Promise<string>
  }
  ssh: {
    connect(input: ConnectRequest): Promise<ConnectResponse>
    write(sessionId: string, data: string): Promise<void>
    resize(sessionId: string, cols: number, rows: number): Promise<void>
    disconnect(sessionId: string): Promise<void>
    onData(callback: (event: SshDataEvent) => void): () => void
    onStatus(callback: (event: SshStatusEvent) => void): () => void
    onHostVerifyRequest(callback: (event: HostVerifyRequestEvent) => void): () => void
    respondHostVerification(verificationId: string, approved: boolean): Promise<void>
  }
  sftp: {
    connect(input: SftpConnectRequest): Promise<SftpConnectResponse>
    listDir(sessionId: string, path: string): Promise<FileEntry[]>
    upload(sessionId: string, localPath: string, remotePath: string): Promise<void>
    download(sessionId: string, remotePath: string, localPath: string): Promise<void>
    disconnect(sessionId: string): Promise<void>
    onStatus(callback: (event: SftpStatusEvent) => void): () => void
  }
  auth: {
    register(input: { email: string; password: string; deviceName?: string }): Promise<{
      user: AuthUser
      isAuthenticated: boolean
    }>
    login(input: { email: string; password: string; deviceName?: string }): Promise<{
      user: AuthUser
      isAuthenticated: boolean
    }>
    logout(): Promise<{ isAuthenticated: boolean }>
    refresh(): Promise<{ isAuthenticated: boolean; user: AuthUser | null }>
    getSession(): Promise<{ isAuthenticated: boolean; user: AuthUser | null }>
  }
  profiles: {
    list(): Promise<PublicServerProfile[]>
    save(input: SaveProfileRequest): Promise<PublicServerProfile>
    remove(id: string): Promise<void>
    sync(): Promise<PublicServerProfile[]>
    listLocalOnly(): Promise<ProfileMigrationCandidate[]>
    importLocal(): Promise<PublicServerProfile[]>
  }
  files: {
    selectPrivateKey(): Promise<string | null>
    getHomeDir(): Promise<string>
    listLocalDir(path: string): Promise<FileEntry[]>
  }
}

declare global {
  interface Window {
    desktopApi: DesktopApi
  }
}
