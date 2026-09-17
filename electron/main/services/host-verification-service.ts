import { randomUUID } from 'node:crypto'

import { webContents } from 'electron'

import { HOST_VERIFICATION_TIMEOUT_MS } from '@shared/constants/validation'
import type { HostVerifyKind, HostVerifyRequestEvent } from '@shared/contracts/host'
import { SSH_ERROR_MESSAGES } from '@shared/errors/ssh-messages'
import { IPC_CHANNELS } from '@shared/ipc-channels'

import { logger } from './logger'

type PendingVerification = {
  webContentsId: number
  sessionId: string
  resolve: (approved: boolean) => void
  timeoutId: ReturnType<typeof setTimeout>
}

export class HostVerificationService {
  private readonly pending = new Map<string, PendingVerification>()
  private readonly sessionReasons = new Map<string, string>()

  async verifyHostKey(options: {
    webContentsId: number
    sessionId: string
    host: string
    port: number
    fingerprint: string
    kind: HostVerifyKind
    expectedFingerprint?: string
  }): Promise<boolean> {
    if (options.kind === 'mismatch') {
      this.sessionReasons.set(options.sessionId, SSH_ERROR_MESSAGES.FINGERPRINT_MISMATCH)
      this.notifyRenderer(
        {
          verificationId: randomUUID(),
          sessionId: options.sessionId,
          host: options.host,
          port: options.port,
          fingerprint: options.fingerprint,
          kind: 'mismatch',
          expectedFingerprint: options.expectedFingerprint,
        },
        options.webContentsId,
      )
      return false
    }

    const verificationId = randomUUID()

    return new Promise<boolean>((resolve) => {
      const finalize = (approved: boolean) => {
        const pending = this.pending.get(verificationId)

        if (!pending) {
          return
        }

        clearTimeout(pending.timeoutId)
        this.pending.delete(verificationId)

        if (!approved) {
          this.sessionReasons.set(options.sessionId, SSH_ERROR_MESSAGES.HOST_REJECTED)
        }

        resolve(approved)
      }

      const timeoutId = setTimeout(() => {
        this.sessionReasons.set(options.sessionId, SSH_ERROR_MESSAGES.HOST_VERIFY_TIMEOUT)
        finalize(false)
      }, HOST_VERIFICATION_TIMEOUT_MS)

      this.pending.set(verificationId, {
        webContentsId: options.webContentsId,
        sessionId: options.sessionId,
        resolve: finalize,
        timeoutId,
      })

      this.notifyRenderer(
        {
          verificationId,
          sessionId: options.sessionId,
          host: options.host,
          port: options.port,
          fingerprint: options.fingerprint,
          kind: 'unknown',
        },
        options.webContentsId,
      )
    })
  }

  respond(verificationId: string, approved: boolean, webContentsId: number): void {
    const pending = this.pending.get(verificationId)

    if (!pending || pending.webContentsId !== webContentsId) {
      throw new Error('Geçersiz host doğrulama isteği.')
    }

    pending.resolve(approved)
  }

  consumeSessionReason(sessionId: string): string | null {
    const reason = this.sessionReasons.get(sessionId) ?? null
    this.sessionReasons.delete(sessionId)
    return reason
  }

  cancelForWebContents(webContentsId: number): void {
    for (const [verificationId, pending] of this.pending.entries()) {
      if (pending.webContentsId !== webContentsId) {
        continue
      }

      clearTimeout(pending.timeoutId)
      this.sessionReasons.set(pending.sessionId, SSH_ERROR_MESSAGES.HOST_REJECTED)
      pending.resolve(false)
      this.pending.delete(verificationId)
    }
  }

  cancelAll(): void {
    for (const [verificationId, pending] of this.pending.entries()) {
      clearTimeout(pending.timeoutId)
      pending.resolve(false)
      this.pending.delete(verificationId)
    }

    this.sessionReasons.clear()
  }

  private notifyRenderer(payload: HostVerifyRequestEvent, webContentsId: number): void {
    const contents = webContents.fromId(webContentsId)

    if (!contents || contents.isDestroyed()) {
      logger.warn('Host doğrulama bildirimi gönderilemedi', {
        webContentsId,
        host: payload.host,
        port: payload.port,
      })
      return
    }

    contents.send(IPC_CHANNELS.ssh.hostVerifyRequest, payload)
  }
}

export const hostVerificationService = new HostVerificationService()
