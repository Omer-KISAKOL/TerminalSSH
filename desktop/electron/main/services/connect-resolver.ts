import type { ConnectRequest } from '@shared/contracts/ssh'

import { privateKeyResolverPath } from './private-key-resolver'
import { profileManager } from './profile-manager'

export async function resolveConnectRequest(request: ConnectRequest): Promise<ConnectRequest> {
  if (!request.profileId) {
    return request
  }

  const profile = profileManager.get(request.profileId)

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
    resolved.password = profileManager.resolvePassword(profile, request.password)
    resolved.privateKeyPath = undefined
    resolved.passphrase = undefined
    return resolved
  }

  const privateKeyContent = profileManager.resolvePrivateKeyContent(profile)
  resolved.privateKeyPath = privateKeyResolverPath(
    request.privateKeyPath ?? profileManager.resolvePrivateKeyPath(profile),
    privateKeyContent,
  )

  if (!resolved.privateKeyPath) {
    throw new Error('Özel anahtar dosyası seçilmeli.')
  }

  resolved.passphrase = profileManager.resolvePassphrase(profile, request.passphrase)
  resolved.password = undefined

  return resolved
}
