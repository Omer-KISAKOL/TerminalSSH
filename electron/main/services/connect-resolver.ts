import type { ConnectRequest } from '@shared/contracts/ssh'

import { profileStore } from './profile-store'

export async function resolveConnectRequest(request: ConnectRequest): Promise<ConnectRequest> {
  if (!request.profileId) {
    return request
  }

  const profile = profileStore.get(request.profileId)

  if (!profile) {
    throw new Error('Profil bulunamadı.')
  }

  const resolved: ConnectRequest = {
    ...request,
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
