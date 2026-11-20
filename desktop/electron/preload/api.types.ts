import type {
  PasswordResetConfirmRequest,
  PasswordResetQuestionRequest,
  PasswordResetQuestionResponse,
  RegisterRequest,
  SecuritySetupRequest,
  SessionResponse,
} from '@shared/contracts/auth'
import type { HostVerifyRequestEvent } from '@shared/contracts/host'
import type {
  ProfileEditSecrets,
  ProfileExportResult,
  ProfileImportResult,
  ProfileMigrationCandidate,
  PublicServerProfile,
  SaveProfileRequest,
} from '@shared/contracts/profile'
import type { ProfileSnippet, SaveSnippetRequest } from '@shared/contracts/snippet'
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
    syncLocale(locale: 'tr' | 'en'): Promise<boolean>
    onOpenSftpTab(callback: () => void): () => void
    onFocusSftpTab(callback: () => void): () => void
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
    register(input: RegisterRequest): Promise<SessionResponse>
    login(input: { email: string; password: string; deviceName?: string }): Promise<SessionResponse>
    logout(): Promise<{ isAuthenticated: boolean }>
    refresh(): Promise<SessionResponse>
    getSession(): Promise<SessionResponse>
    completeSecuritySetup(input: SecuritySetupRequest): Promise<SessionResponse>
    getPasswordResetQuestion(input: PasswordResetQuestionRequest): Promise<PasswordResetQuestionResponse>
    resetPassword(input: PasswordResetConfirmRequest): Promise<{ ok: boolean }>
  }
  profiles: {
    list(): Promise<PublicServerProfile[]>
    save(input: SaveProfileRequest): Promise<PublicServerProfile>
    remove(id: string): Promise<void>
    sync(): Promise<PublicServerProfile[]>
    listLocalOnly(): Promise<ProfileMigrationCandidate[]>
    importLocal(): Promise<PublicServerProfile[]>
    exportToFile(input: { includeSecrets: boolean }): Promise<ProfileExportResult>
    importFromFile(): Promise<ProfileImportResult>
    getEditSecrets(id: string): Promise<ProfileEditSecrets>
  }
  snippets: {
    list(): Promise<ProfileSnippet[]>
    save(input: SaveSnippetRequest): Promise<ProfileSnippet>
    remove(snippetId: string): Promise<void>
    reorder(orderedIds: string[]): Promise<ProfileSnippet[]>
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
