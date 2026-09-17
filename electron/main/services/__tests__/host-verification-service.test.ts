import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()

vi.mock('electron', () => ({
  app: {
    isPackaged: false,
  },
  webContents: {
    fromId: vi.fn(() => ({
      isDestroyed: () => false,
      send: sendMock,
    })),
  },
}))

import { SSH_ERROR_MESSAGES } from '@shared/errors/ssh-messages'
import { IPC_CHANNELS } from '@shared/ipc-channels'

import { HostVerificationService } from '../host-verification-service'

describe('HostVerificationService', () => {
  let service: HostVerificationService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new HostVerificationService()
  })

  it('bilinmeyen host için onay bekler', async () => {
    const verifyPromise = service.verifyHostKey({
      webContentsId: 1,
      sessionId: 'session-1',
      host: 'example.com',
      port: 22,
      fingerprint: 'SHA256:abc',
      kind: 'unknown',
    })

    expect(sendMock).toHaveBeenCalledWith(
      IPC_CHANNELS.ssh.hostVerifyRequest,
      expect.objectContaining({
        host: 'example.com',
        port: 22,
        fingerprint: 'SHA256:abc',
        kind: 'unknown',
      }),
    )

    const verificationId = sendMock.mock.calls[0]?.[1]?.verificationId as string
    service.respond(verificationId, true, 1)

    await expect(verifyPromise).resolves.toBe(true)
  })

  it('farklı webContents yanıtını reddeder', async () => {
    const verifyPromise = service.verifyHostKey({
      webContentsId: 1,
      sessionId: 'session-1',
      host: 'example.com',
      port: 22,
      fingerprint: 'SHA256:abc',
      kind: 'unknown',
    })

    const verificationId = sendMock.mock.calls[0]?.[1]?.verificationId as string

    expect(() => service.respond(verificationId, true, 99)).toThrow(
      'Geçersiz host doğrulama isteği.',
    )

    service.respond(verificationId, false, 1)
    await expect(verifyPromise).resolves.toBe(false)
  })

  it('fingerprint uyuşmazlığında bağlantıyı reddeder', async () => {
    const approved = await service.verifyHostKey({
      webContentsId: 1,
      sessionId: 'session-2',
      host: 'example.com',
      port: 22,
      fingerprint: 'SHA256:new',
      kind: 'mismatch',
      expectedFingerprint: 'SHA256:old',
    })

    expect(approved).toBe(false)
    expect(service.consumeSessionReason('session-2')).toBe(SSH_ERROR_MESSAGES.FINGERPRINT_MISMATCH)
  })

  it('webContents iptalinde bekleyen doğrulamayı reddeder', async () => {
    const verifyPromise = service.verifyHostKey({
      webContentsId: 7,
      sessionId: 'session-3',
      host: 'example.com',
      port: 22,
      fingerprint: 'SHA256:abc',
      kind: 'unknown',
    })

    service.cancelForWebContents(7)

    await expect(verifyPromise).resolves.toBe(false)
    expect(service.consumeSessionReason('session-3')).toBe(SSH_ERROR_MESSAGES.HOST_REJECTED)
  })
})
