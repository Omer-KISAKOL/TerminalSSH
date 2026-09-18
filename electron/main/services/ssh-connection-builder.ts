import { readFile } from 'node:fs/promises'

import type { ConnectConfig } from 'ssh2'

import type { ConnectRequest } from '@shared/contracts/ssh'

import { formatHostFingerprint } from './fingerprint'
import { hostVerificationService } from './host-verification-service'
import { knownHostsStore } from './known-hosts-store'
import { logger } from './logger'

export const CONNECTION_TIMEOUT_MS = 15_000

export async function buildSshConnectConfig(
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
      void verifyHostKey(hostKey, request, sessionId, webContentsId, verify)
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

async function verifyHostKey(
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
