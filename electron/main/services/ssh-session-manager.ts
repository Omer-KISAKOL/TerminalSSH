import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'

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

import { formatHostFingerprint } from './fingerprint'
import { hostVerificationService } from './host-verification-service'
import { knownHostsStore } from './known-hosts-store'
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

  async connect(webContentsId: number, request: ConnectRequest): Promise<ConnectResponse> {
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

    let connectOptions: ConnectConfig

    try {
      connectOptions = await this.buildConnectOptions(request, sessionId, webContentsId)
    } catch (error) {
      this.clearTimeout(session)
      this.sessions.delete(sessionId)
      hostVerificationService.cancelForWebContents(webContentsId)
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

  private async buildConnectOptions(
    request: ConnectRequest,
    sessionId: string,
    webContentsId: number,
  ): Promise<ConnectConfig> {
    const baseConfig: ConnectConfig = {
      host: request.host,
      port: request.port,
      username: request.username,
      readyTimeout: CONNECTION_TIMEOUT_MS,
      hostVerifier: (hostKey: Buffer, verify: (approved: boolean) => void) => {
        void this.verifyHostKey(hostKey, request, sessionId, webContentsId, verify)
      },
    }

    if (request.authType === 'password') {
      if (!request.password) {
        throw new Error('Parola gerekli.')
      }

      return {
        ...baseConfig,
        password: request.password,
      }
    }

    if (!request.privateKeyPath) {
      throw new Error('Özel anahtar dosyası seçilmeli.')
    }

    try {
      const privateKey = await readFile(request.privateKeyPath)

      return {
        ...baseConfig,
        privateKey,
        passphrase: request.passphrase,
      }
    } catch (error) {
      logger.error('Özel anahtar okunamadı', {
        sessionId,
        code:
          error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined,
      })
      throw new Error('Özel anahtar okunamadı.')
    }
  }

  private async verifyHostKey(
    hostKey: Buffer,
    request: ConnectRequest,
    sessionId: string,
    webContentsId: number,
    verify: (approved: boolean) => void,
  ): Promise<void> {
    const fingerprint = formatHostFingerprint(hostKey)
    const knownHost = knownHostsStore.get(request.host, request.port)

    if (knownHost) {
      if (knownHost.fingerprint === fingerprint) {
        verify(true)
        return
      }

      const approved = await hostVerificationService.verifyHostKey({
        webContentsId,
        sessionId,
        host: request.host,
        port: request.port,
        fingerprint,
        kind: 'mismatch',
        expectedFingerprint: knownHost.fingerprint,
      })

      verify(approved)
      return
    }

    const approved = await hostVerificationService.verifyHostKey({
      webContentsId,
      sessionId,
      host: request.host,
      port: request.port,
      fingerprint,
      kind: 'unknown',
    })

    if (approved) {
      knownHostsStore.save(request.host, request.port, fingerprint)
    }

    verify(approved)
  }

  write(webContentsId: number, sessionId: string, data: string): void {
    const session = this.getOwnedSession(webContentsId, sessionId)

    if (session.status !== 'connected' || !session.stream) {
      throw new Error('Aktif bir SSH oturumu bulunamadı.')
    }

    session.stream.write(data)
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

  private finalizeSession(session: Session, status: ConnectionStatus, message?: string): void {
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
