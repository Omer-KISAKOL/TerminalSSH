import type { ConnectRequest } from '@shared/contracts/ssh'
import type { SftpConnectRequest } from '@shared/contracts/sftp'

import { profileStore } from './profile-store'

export async function resolveSftpConnectRequest(
  request: SftpConnectRequest,
): Promise<ConnectRequest> {
  const baseRequest: ConnectRequest = {
    profileId: request.profileId,
    host: request.host,
    port: request.port,
    username: request.username,
    authType: request.authType,
    password: request.password,
    privateKeyPath: request.privateKeyPath,
    passphrase: request.passphrase,
    cols: 80,
    rows: 24,
  }

  if (!request.profileId) {
    return baseRequest
  }

  const profile = profileStore.get(request.profileId)

  if (!profile) {
    throw new Error('Profil bulunamadı.')
  }

  const resolved: ConnectRequest = {
    ...baseRequest,
    profileId: profile.id,
    host: profile.host,
    port: profile.port,
    username: profile.username,
    authType: profile.authType,
  }

  if (profile.authType === 'password') {
    resolved.password = profileStore.resolvePassword(profile, request.password)
    resolved.privateKeyPath = undefined
    resolved.passphrase = undefined
    return resolved
  }

  resolved.privateKeyPath = request.privateKeyPath ?? profile.privateKeyPath

  if (!resolved.privateKeyPath) {
    throw new Error('Özel anahtar dosyası seçilmeli.')
  }

  resolved.passphrase = profileStore.resolvePassphrase(profile, request.passphrase)
  resolved.password = undefined

  return resolved
}
