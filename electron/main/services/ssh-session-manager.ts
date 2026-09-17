import { randomUUID } from 'node:crypto'

import { webContents } from 'electron'
import { Client, type ClientChannel } from 'ssh2'

import type {
  ConnectRequest,
  ConnectResponse,
  ConnectionStatus,
  SshDataEvent,
  SshStatusEvent,
} from '@shared/contracts/ssh'
import { IPC_CHANNELS } from '@shared/ipc-channels'

import { logger } from './logger'
import { mapSshError } from './ssh-errors'

const CONNECTION_TIMEOUT_MS = 15_000

interface Session {
  sessionId: string
  client: Client
  stream: ClientChannel | null
  status: ConnectionStatus
  webContentsId: number
  connectRequest: ConnectRequest
  timeoutId: ReturnType<typeof setTimeout> | null
}

export class SshSessionManager {
  private readonly sessions = new Map<string, Session>()

  async connect(
    webContentsId: number,
    request: ConnectRequest,
  ): Promise<ConnectResponse> {
    this.disconnectAllForWebContents(webContentsId)

    const sessionId = randomUUID()
    const client = new Client()

    const session: Session = {
      sessionId,
      client,
      stream: null,
      status: 'connecting',
      webContentsId,
      connectRequest: request,
      timeoutId: null,
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

    return new Promise<ConnectResponse>((resolve, reject) => {
      let settled = false

      const settle = (callback: () => void) => {
        if (settled) {
          return
        }

        settled = true
        callback()
      }

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
              const message = mapSshError(shellError)
              this.finalizeSession(session, 'error', message)
              client.end()
              settle(() => reject(new Error(message)))
              return
            }

            session.stream = stream
            session.status = 'connected'
            this.attachStreamHandlers(session, stream)
            this.emitStatus(session, 'connected')
            settle(() => resolve({ sessionId }))
          },
        )
      })

      client.on('error', (error) => {
        this.clearTimeout(session)

        if (session.status === 'disconnecting' || session.status === 'disconnected') {
          return
        }

        const message = mapSshError(error)
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
        if (
          this.sessions.has(session.sessionId) &&
          session.status === 'connected'
        ) {
          this.finalizeSession(session, 'disconnected')
        }
      })

      client.connect({
        host: request.host,
        port: request.port,
        username: request.username,
        password: request.password,
        readyTimeout: CONNECTION_TIMEOUT_MS,
        // TODO(Aşama 4): host fingerprint doğrulaması uygulanacak.
        // Şu an bilinçli olarak devre dışı; otomatik güven varsayılmamalı.
        hostVerifier: () => {
          logger.warn('SSH host fingerprint doğrulaması henüz uygulanmadı', {
            sessionId,
            host: request.host,
          })
          return true
        },
      })
    })
  }

  write(webContentsId: number, sessionId: string, data: string): void {
    const session = this.getOwnedSession(webContentsId, sessionId)

    if (session.status !== 'connected' || !session.stream) {
      throw new Error('Aktif bir SSH oturumu bulunamadı.')
    }

    session.stream.write(data)
  }

  resize(
    webContentsId: number,
    sessionId: string,
    cols: number,
    rows: number,
  ): void {
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

  private finalizeSession(
    session: Session,
    status: ConnectionStatus,
    message?: string,
  ): void {
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

  private emitStatus(
    session: Session,
    status: ConnectionStatus,
    message?: string,
  ): void {
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
