import { randomUUID } from 'node:crypto'

import { webContents } from 'electron'
import { Client, type ClientChannel, type ConnectConfig } from 'ssh2'

import type {
  ConnectRequest,
  ConnectResponse,
  ConnectionStatus,
  SshDataEvent,
  SshStatusEvent,
} from '@shared/contracts/ssh'
import { IPC_CHANNELS } from '@shared/ipc-channels'

import { buildServerKey, operationalTimelineStore } from './operational-timeline-store'
import { hostVerificationService } from './host-verification-service'
import { logger } from './logger'
import { profileManager } from './profile-manager'
import { clearCachedIntelligence } from './server-intelligence-cache'
import { mapSshError } from './ssh-errors'
import { buildSshConnectConfig, CONNECTION_TIMEOUT_MS } from './ssh-connection-builder'

export interface SshSessionMeta {
  sessionId: string
  serverKey: string
  host: string
  port: number
  username: string
  profileId: string | null
  profileName: string | null
}

interface Session {
  sessionId: string
  client: Client
  stream: ClientChannel | null
  status: ConnectionStatus
  webContentsId: number
  connectRequest: ConnectRequest
  timeoutId: ReturnType<typeof setTimeout> | null
  serverKey: string
  profileName: string | null
  commandLineBuffer: string
  closeLogged: boolean
}

export class SshSessionManager {
  private readonly sessions = new Map<string, Session>()

  async connect(webContentsId: number, request: ConnectRequest): Promise<ConnectResponse> {
    const sessionId = randomUUID()
    const client = new Client()

    const profileName = request.profileId
      ? (profileManager.get(request.profileId)?.name ?? null)
      : null

    const session: Session = {
      sessionId,
      client,
      stream: null,
      status: 'connecting',
      webContentsId,
      connectRequest: request,
      timeoutId: null,
      serverKey: buildServerKey({
        host: request.host,
        port: request.port,
        username: request.username,
        profileId: request.profileId,
      }),
      profileName,
      commandLineBuffer: '',
      closeLogged: false,
    }

    this.sessions.set(sessionId, session)
    this.emitStatus(session, 'connecting')

    logger.info('SSH bağlantısı başlatılıyor', {
      sessionId,
      host: request.host,
      port: request.port,
      username: request.username,
      authType: request.authType,
    })

    session.timeoutId = setTimeout(() => {
      if (session.status === 'connecting') {
        logger.warn('SSH bağlantısı zaman aşımına uğradı', { sessionId })
        this.finalizeSession(session, 'error', 'Bağlantı zaman aşımına uğradı.')
        client.destroy()
      }
    }, CONNECTION_TIMEOUT_MS)

    let connectOptions: ConnectConfig

    try {
      connectOptions = await buildSshConnectConfig(request, sessionId, webContentsId)
    } catch (error) {
      this.clearTimeout(session)
      this.sessions.delete(sessionId)
      const message = error instanceof Error ? error.message : 'Bağlantı kurulamadı.'
      throw new Error(message)
    }

    return new Promise<ConnectResponse>((resolve, reject) => {
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
        logger.debug('SSH istemcisi hazır', { sessionId })

        client.shell(
          {
            term: 'xterm-256color',
            cols: request.cols,
            rows: request.rows,
          },
          (shellError, stream) => {
            this.clearTimeout(session)

            if (shellError) {
              const message = mapSshError(shellError, sessionReason())
              this.finalizeSession(session, 'error', message)
              client.end()
              settle(() => reject(new Error(message)))
              return
            }

            session.stream = stream
            session.status = 'connected'
            this.attachStreamHandlers(session, stream)
            this.emitStatus(session, 'connected')
            operationalTimelineStore.append({
              serverKey: session.serverKey,
              host: session.connectRequest.host,
              profileId: session.connectRequest.profileId ?? null,
              profileName: session.profileName,
              type: 'connect',
              summary: 'SSH oturumu açıldı',
              detail: `${session.connectRequest.username}@${session.connectRequest.host}:${session.connectRequest.port}`,
            })
            settle(() => resolve({ sessionId }))
          },
        )
      })

      client.on('error', (error) => {
        this.clearTimeout(session)

        if (session.status === 'disconnecting' || session.status === 'disconnected') {
          return
        }

        const message = mapSshError(error, sessionReason())
        logger.error('SSH istemci hatası', {
          sessionId,
          code: 'code' in error ? String(error.code) : undefined,
        })
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

      client.on('end', () => {
        if (this.sessions.has(session.sessionId) && session.status === 'connected') {
          this.finalizeSession(session, 'disconnected')
        }
      })

      client.connect(connectOptions)
    })
  }

  write(webContentsId: number, sessionId: string, data: string): void {
    const session = this.getOwnedSession(webContentsId, sessionId)

    if (session.status !== 'connected' || !session.stream) {
      throw new Error('Aktif bir SSH oturumu bulunamadı.')
    }

    this.trackCommandInput(session, data)
    session.stream.write(data)
  }

  getSessionMeta(webContentsId: number, sessionId: string): SshSessionMeta | null {
    const session = this.sessions.get(sessionId)

    if (!session || session.webContentsId !== webContentsId) {
      return null
    }

    return {
      sessionId: session.sessionId,
      serverKey: session.serverKey,
      host: session.connectRequest.host,
      port: session.connectRequest.port,
      username: session.connectRequest.username,
      profileId: session.connectRequest.profileId ?? null,
      profileName: session.profileName,
    }
  }

  exec(
    webContentsId: number,
    sessionId: string,
    command: string,
    timeoutMs = 20_000,
  ): Promise<{ stdout: string; stderr: string; code: number | null }> {
    const session = this.getOwnedSession(webContentsId, sessionId)

    if (session.status !== 'connected') {
      throw new Error('Aktif bir SSH oturumu bulunamadı.')
    }

    return new Promise((resolve, reject) => {
      let settled = false

      const timer = setTimeout(() => {
        if (settled) {
          return
        }

        settled = true
        reject(new Error('Komut zaman aşımına uğradı.'))
      }, timeoutMs)

      session.client.exec(command, (error, stream) => {
        if (error) {
          clearTimeout(timer)
          if (!settled) {
            settled = true
            reject(error)
          }

          return
        }

        let stdout = ''
        let stderr = ''

        stream.on('data', (chunk: Buffer) => {
          stdout += chunk.toString('utf8')
        })

        stream.stderr.on('data', (chunk: Buffer) => {
          stderr += chunk.toString('utf8')
        })

        stream.on('close', (code: number | null) => {
          clearTimeout(timer)

          if (settled) {
            return
          }

          settled = true
          resolve({ stdout, stderr, code })
        })
      })
    })
  }

  resize(webContentsId: number, sessionId: string, cols: number, rows: number): void {
    const session = this.getOwnedSession(webContentsId, sessionId)

    if (session.status !== 'connected' || !session.stream) {
      return
    }

    session.stream.setWindow(rows, cols, 0, 0)
    session.connectRequest.cols = cols
    session.connectRequest.rows = rows
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

    if (session.stream) {
      session.stream.end()
      session.stream = null
    }

    this.recordSessionClosed(session)
    session.client.end()
    this.finalizeSession(session, 'disconnected')
  }

  disconnectAllForWebContents(webContentsId: number): void {
    hostVerificationService.cancelForWebContents(webContentsId)

    for (const session of this.sessions.values()) {
      if (session.webContentsId === webContentsId) {
        this.disconnect(webContentsId, session.sessionId)
      }
    }
  }

  disconnectAll(): void {
    hostVerificationService.cancelAll()

    for (const session of this.sessions.values()) {
      this.disconnect(session.webContentsId, session.sessionId)
    }
  }

  private attachStreamHandlers(session: Session, stream: ClientChannel): void {
    stream.on('data', (chunk: Buffer) => {
      this.emitData(session, chunk.toString('utf8'))
    })

    stream.on('close', () => {
      if (session.status === 'connected') {
        this.finalizeSession(session, 'disconnected')
      }
    })
  }

  private getOwnedSession(webContentsId: number, sessionId: string): Session {
    const session = this.sessions.get(sessionId)

    if (!session) {
      throw new Error('SSH oturumu bulunamadı.')
    }

    if (session.webContentsId !== webContentsId) {
      throw new Error('Bu oturuma erişim izni yok.')
    }

    return session
  }

  private recordSessionClosed(session: Session): void {
    if (session.closeLogged) {
      return
    }

    session.closeLogged = true
    operationalTimelineStore.append({
      serverKey: session.serverKey,
      host: session.connectRequest.host,
      profileId: session.connectRequest.profileId ?? null,
      profileName: session.profileName,
      type: 'disconnect',
      summary: 'SSH oturumu kapatıldı',
    })
    clearCachedIntelligence(session.sessionId)
  }

  private trackCommandInput(session: Session, data: string): void {
    for (const char of data) {
      if (char === '\r' || char === '\n') {
        const command = session.commandLineBuffer.trim()
        session.commandLineBuffer = ''

        if (command.length > 0 && command.length <= 400) {
          operationalTimelineStore.append({
            serverKey: session.serverKey,
            host: session.connectRequest.host,
            profileId: session.connectRequest.profileId ?? null,
            profileName: session.profileName,
            type: 'command',
            summary: command.length > 72 ? `${command.slice(0, 72)}…` : command,
            detail: command,
          })
        }

        continue
      }

      if (char === '\u007f' || char === '\b') {
        session.commandLineBuffer = session.commandLineBuffer.slice(0, -1)
        continue
      }

      if (char >= ' ' || char === '\t') {
        if (session.commandLineBuffer.length < 512) {
          session.commandLineBuffer += char
        }
      }
    }
  }

  private finalizeSession(session: Session, status: ConnectionStatus, message?: string): void {
    if (session.status === 'connected' && status !== 'connected') {
      this.recordSessionClosed(session)
    }

    session.status = status
    this.emitStatus(session, status, message)
    this.sessions.delete(session.sessionId)
  }

  private clearTimeout(session: Session): void {
    if (session.timeoutId) {
      clearTimeout(session.timeoutId)
      session.timeoutId = null
    }
  }

  private emitData(session: Session, data: string): void {
    const payload: SshDataEvent = {
      sessionId: session.sessionId,
      data,
    }

    this.sendToWebContents(session.webContentsId, IPC_CHANNELS.ssh.data, payload)
  }

  private emitStatus(session: Session, status: ConnectionStatus, message?: string): void {
    const payload: SshStatusEvent = {
      sessionId: session.sessionId,
      status,
      message,
    }

    this.sendToWebContents(session.webContentsId, IPC_CHANNELS.ssh.status, payload)
  }

  private sendToWebContents(
    webContentsId: number,
    channel: string,
    payload: SshDataEvent | SshStatusEvent,
  ): void {
    const contents = webContents.fromId(webContentsId)

    if (!contents || contents.isDestroyed()) {
      return
    }

    contents.send(channel, payload)
  }
}

export const sshSessionManager = new SshSessionManager()
