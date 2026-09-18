import { randomUUID } from 'node:crypto'
import path from 'node:path'

import { webContents } from 'electron'
import { Client, type SFTPWrapper } from 'ssh2'

import type { ConnectRequest } from '@shared/contracts/ssh'
import type {
  FileEntry,
  FileEntryKind,
  SftpConnectResponse,
  SftpStatusEvent,
} from '@shared/contracts/sftp'
import { IPC_CHANNELS } from '@shared/ipc-channels'

import { mapSshError } from './ssh-errors'
import { buildSshConnectConfig, CONNECTION_TIMEOUT_MS } from './ssh-connection-builder'
import { hostVerificationService } from './host-verification-service'

type ConnectionStatus = SftpStatusEvent['status']

interface SftpSession {
  sessionId: string
  client: Client
  sftp: SFTPWrapper | null
  status: ConnectionStatus
  webContentsId: number
  timeoutId: ReturnType<typeof setTimeout> | null
}

function formatRemotePermissions(mode: number): string {
  const types = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx']
  const owner = types[(mode >> 6) & 7] ?? '---'
  const group = types[(mode >> 3) & 7] ?? '---'
  const other = types[mode & 7] ?? '---'
  const prefix = (mode & 0o40000) !== 0 ? 'd' : (mode & 0o120000) !== 0 ? 'l' : '-'

  return `${prefix}${owner}${group}${other}`
}

function toRemoteKind(mode: number): FileEntryKind {
  if ((mode & 0o40000) !== 0) {
    return 'directory'
  }

  if ((mode & 0o120000) !== 0) {
    return 'symlink'
  }

  return 'file'
}

export class SftpSessionManager {
  private readonly sessions = new Map<string, SftpSession>()

  async connect(webContentsId: number, request: ConnectRequest): Promise<SftpConnectResponse> {
    const sessionId = randomUUID()
    const client = new Client()

    const session: SftpSession = {
      sessionId,
      client,
      sftp: null,
      status: 'connecting',
      webContentsId,
      timeoutId: null,
    }

    this.sessions.set(sessionId, session)
    this.emitStatus(session, 'connecting')

    session.timeoutId = setTimeout(() => {
      if (session.status === 'connecting') {
        this.finalizeSession(session, 'error', 'Bağlantı zaman aşımına uğradı.')
        client.destroy()
      }
    }, CONNECTION_TIMEOUT_MS)

    let connectOptions

    try {
      connectOptions = await buildSshConnectConfig(request, sessionId, webContentsId)
    } catch (error) {
      this.clearTimeout(session)
      this.sessions.delete(sessionId)
      const message = error instanceof Error ? error.message : 'Bağlantı kurulamadı.'
      throw new Error(message)
    }

    return new Promise<SftpConnectResponse>((resolve, reject) => {
      let settled = false

      const settle = (callback: () => void) => {
        if (settled) {
          return
        }

        settled = true
        callback()
      }

      const sessionReason = () =>
        hostVerificationService.consumeSessionReason(sessionId)

      client.on('ready', () => {
        client.sftp((sftpError, sftp) => {
          this.clearTimeout(session)

          if (sftpError) {
            const message = mapSshError(sftpError, sessionReason())
            this.finalizeSession(session, 'error', message)
            client.end()
            settle(() => reject(new Error(message)))
            return
          }

          session.sftp = sftp
          session.status = 'connected'
          this.emitStatus(session, 'connected')
          settle(() => resolve({ sessionId }))
        })
      })

      client.on('error', (error) => {
        this.clearTimeout(session)

        if (session.status === 'disconnecting' || session.status === 'disconnected') {
          return
        }

        const message = mapSshError(error, sessionReason())
        this.finalizeSession(session, 'error', message)
        settle(() => reject(new Error(message)))
      })

      client.on('close', () => {
        this.clearTimeout(session)

        if (
          this.sessions.has(session.sessionId) &&
          (session.status === 'connected' || session.status === 'connecting')
        ) {
          this.finalizeSession(session, 'disconnected')
        }
      })

      client.connect(connectOptions)
    })
  }

  async listDirectory(webContentsId: number, sessionId: string, remotePath: string): Promise<FileEntry[]> {
    const session = this.getOwnedSession(webContentsId, sessionId)

    if (!session.sftp || session.status !== 'connected') {
      throw new Error('Aktif bir SFTP oturumu bulunamadı.')
    }

    const normalizedPath = remotePath.startsWith('/') ? remotePath : `/${remotePath}`

    return new Promise<FileEntry[]>((resolve, reject) => {
      session.sftp?.readdir(normalizedPath, (error, list) => {
        if (error) {
          reject(new Error('Uzak dizin okunamadı.'))
          return
        }

        const entries = list
          .map((item) => {
            const attrs = item.attrs
            const entryPath = path.posix.join(normalizedPath, item.filename)

            return {
              name: item.filename,
              path: entryPath,
              kind: toRemoteKind(attrs.mode ?? 0),
              size: attrs.size ?? null,
              modifiedAt: attrs.mtime ? new Date(attrs.mtime * 1000).toISOString() : null,
              permissions: formatRemotePermissions(attrs.mode ?? 0),
            } satisfies FileEntry
          })
          .sort((left, right) => {
            if (left.kind === 'directory' && right.kind !== 'directory') {
              return -1
            }

            if (left.kind !== 'directory' && right.kind === 'directory') {
              return 1
            }

            return left.name.localeCompare(right.name, 'tr')
          })

        resolve(entries)
      })
    })
  }

  async upload(
    webContentsId: number,
    sessionId: string,
    localPath: string,
    remotePath: string,
  ): Promise<void> {
    const session = this.getOwnedSession(webContentsId, sessionId)

    if (!session.sftp || session.status !== 'connected') {
      throw new Error('Aktif bir SFTP oturumu bulunamadı.')
    }

    return new Promise<void>((resolve, reject) => {
      session.sftp?.fastPut(localPath, remotePath, (error) => {
        if (error) {
          reject(new Error('Dosya yüklenemedi.'))
          return
        }

        resolve()
      })
    })
  }

  async download(
    webContentsId: number,
    sessionId: string,
    remotePath: string,
    localPath: string,
  ): Promise<void> {
    const session = this.getOwnedSession(webContentsId, sessionId)

    if (!session.sftp || session.status !== 'connected') {
      throw new Error('Aktif bir SFTP oturumu bulunamadı.')
    }

    return new Promise<void>((resolve, reject) => {
      session.sftp?.fastGet(remotePath, localPath, (error) => {
        if (error) {
          reject(new Error('Dosya indirilemedi.'))
          return
        }

        resolve()
      })
    })
  }

  disconnect(webContentsId: number, sessionId: string): void {
    const session = this.sessions.get(sessionId)

    if (!session || session.webContentsId !== webContentsId) {
      return
    }

    if (
      session.status === 'disconnected' ||
      session.status === 'disconnecting' ||
      session.status === 'error'
    ) {
      this.sessions.delete(sessionId)
      return
    }

    session.status = 'disconnecting'
    this.emitStatus(session, 'disconnecting')
    this.clearTimeout(session)
    session.client.end()
    this.finalizeSession(session, 'disconnected')
  }

  disconnectAllForWebContents(webContentsId: number): void {
    for (const session of this.sessions.values()) {
      if (session.webContentsId === webContentsId) {
        this.disconnect(webContentsId, session.sessionId)
      }
    }
  }

  disconnectAll(): void {
    for (const session of this.sessions.values()) {
      this.disconnect(session.webContentsId, session.sessionId)
    }
  }

  private getOwnedSession(webContentsId: number, sessionId: string): SftpSession {
    const session = this.sessions.get(sessionId)

    if (!session) {
      throw new Error('SFTP oturumu bulunamadı.')
    }

    if (session.webContentsId !== webContentsId) {
      throw new Error('Bu oturuma erişim izni yok.')
    }

    return session
  }

  private finalizeSession(session: SftpSession, status: ConnectionStatus, message?: string): void {
    session.status = status
    this.emitStatus(session, status, message)
    this.sessions.delete(session.sessionId)
  }

  private clearTimeout(session: SftpSession): void {
    if (session.timeoutId) {
      clearTimeout(session.timeoutId)
      session.timeoutId = null
    }
  }

  private emitStatus(session: SftpSession, status: ConnectionStatus, message?: string): void {
    const payload: SftpStatusEvent = {
      sessionId: session.sessionId,
      status,
      message,
    }

    const contents = webContents.fromId(session.webContentsId)

    if (!contents || contents.isDestroyed()) {
      return
    }

    contents.send(IPC_CHANNELS.sftp.status, payload)
  }
}

export const sftpSessionManager = new SftpSessionManager()
