import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { TerminalSshApiClient } from '@terminalssh/api-client'
import type { CloudProfile, SaveCloudProfileInput, SyncCloudProfileInput } from '@terminalssh/api-client'

import type { SaveProfileRequest, ServerProfile } from '@shared/contracts/profile'

import { authStore } from './auth-store'
import { assertCanStoreSecrets, encryptSecret } from './secret-store'

function getApiBaseUrl(): string {
  return process.env.TERMINALSSH_API_URL ?? 'http://localhost:8787'
}

function createApiClient(): TerminalSshApiClient {
  return new TerminalSshApiClient({
    baseUrl: getApiBaseUrl(),
    getAccessToken: () => authStore.getSession()?.accessToken ?? null,
    getRefreshToken: () => authStore.getSession()?.refreshToken ?? null,
    onSessionUpdate: (session) => {
      authStore.setSession(session)
    },
  })
}

function readPrivateKeyContent(path?: string, content?: string): string | null {
  if (content) {
    return content
  }

  if (!path) {
    return null
  }

  return readFileSync(path, 'utf8')
}

function toSaveCloudInput(request: SaveProfileRequest, profileId: string): SaveCloudProfileInput {
  return {
    id: profileId,
    name: request.name,
    host: request.host,
    port: request.port,
    username: request.username,
    authType: request.authType,
    savePassword: request.savePassword,
    savePassphrase: request.savePassphrase,
    password: request.password ?? null,
    passphrase: request.passphrase ?? null,
    privateKey: readPrivateKeyContent(request.privateKeyPath, request.privateKeyContent),
  }
}

export function cloudProfileToServerProfile(profile: CloudProfile): ServerProfile {
  const serverProfile: ServerProfile = {
    id: profile.id,
    name: profile.name,
    host: profile.host,
    port: profile.port,
    username: profile.username,
    authType: profile.authType,
    savePassword: profile.savePassword,
    savePassphrase: profile.savePassphrase,
    lastConnectedAt: profile.lastConnectedAt ?? undefined,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    syncSource: 'cloud',
  }

  if (profile.privateKey) {
    serverProfile.privateKeyContent = profile.privateKey
  }

  try {
    assertCanStoreSecrets()

    if (profile.password) {
      serverProfile.encryptedPassword = encryptSecret(profile.password)
    }

    if (profile.passphrase) {
      serverProfile.encryptedPassphrase = encryptSecret(profile.passphrase)
    }

    if (profile.privateKey) {
      serverProfile.encryptedPrivateKey = encryptSecret(profile.privateKey)
    }
  } catch {
    // Cache without local encryption if OS vault unavailable.
    if (profile.password) {
      serverProfile.encryptedPassword = profile.password
    }
  }

  return serverProfile
}

export class CloudProfileService {
  private readonly api = createApiClient()

  async listProfiles(): Promise<ServerProfile[]> {
    const response = await this.api.listProfiles()
    return response.profiles.map(cloudProfileToServerProfile)
  }

  async saveProfile(request: SaveProfileRequest, profileId?: string): Promise<ServerProfile> {
    const id = profileId ?? request.id

    const input = toSaveCloudInput(request, id ?? randomUUID())

    const response = id
      ? await this.api.updateProfile(id, input)
      : await this.api.createProfile(input)

    return cloudProfileToServerProfile(response.profile)
  }

  async removeProfile(id: string): Promise<void> {
    await this.api.deleteProfile(id)
  }

  async syncProfiles(profiles: SyncCloudProfileInput[]): Promise<ServerProfile[]> {
    const response = await this.api.syncProfiles(profiles)
    return response.profiles.map(cloudProfileToServerProfile)
  }

  async markConnected(id: string): Promise<void> {
    await this.api.markConnected(id)
  }
}

export const cloudProfileService = new CloudProfileService()
