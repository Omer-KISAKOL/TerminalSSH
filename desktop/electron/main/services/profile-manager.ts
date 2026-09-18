import { readFileSync } from 'node:fs'

import type {
  ProfileExportBundle,
  ProfileExportEntry,
  ProfileMigrationCandidate,
  PublicServerProfile,
  SaveProfileRequest,
  ServerProfile,
} from '@shared/contracts/profile'
import type { SyncCloudProfileInput } from '@terminalssh/api-client'

import { authStore } from './auth-store'
import { cloudProfileService } from './cloud-profile-service'
import { decryptSecret } from './secret-store'
import { profileStore } from './profile-store'

function toPublicProfile(profile: ServerProfile): PublicServerProfile {
  return {
    id: profile.id,
    name: profile.name,
    host: profile.host,
    port: profile.port,
    username: profile.username,
    authType: profile.authType,
    privateKeyPath: profile.privateKeyPath,
    savePassword: profile.savePassword,
    savePassphrase: profile.savePassphrase,
    hasSavedPassword: Boolean(profile.encryptedPassword),
    hasSavedPassphrase: Boolean(profile.encryptedPassphrase),
    hasSavedPrivateKey: Boolean(profile.encryptedPrivateKey || profile.privateKeyContent),
    lastConnectedAt: profile.lastConnectedAt,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    syncSource: profile.syncSource ?? 'local',
  }
}

function sortProfiles(profiles: PublicServerProfile[]): PublicServerProfile[] {
  return [...profiles].sort((left, right) => {
    const leftTime = left.lastConnectedAt ? Date.parse(left.lastConnectedAt) : 0
    const rightTime = right.lastConnectedAt ? Date.parse(right.lastConnectedAt) : 0

    if (leftTime !== rightTime) {
      return rightTime - leftTime
    }

    return left.name.localeCompare(right.name, 'tr')
  })
}

function localProfileToSyncInput(profile: ServerProfile): SyncCloudProfileInput {
  let password: string | null = null
  let passphrase: string | null = null
  let privateKey: string | null = profile.privateKeyContent ?? null

  if (profile.encryptedPassword) {
    try {
      password = decryptSecret(profile.encryptedPassword)
    } catch {
      password = null
    }
  }

  if (profile.encryptedPassphrase) {
    try {
      passphrase = decryptSecret(profile.encryptedPassphrase)
    } catch {
      passphrase = null
    }
  }

  if (!privateKey && profile.privateKeyPath) {
    try {
      privateKey = readFileSync(profile.privateKeyPath, 'utf8')
    } catch {
      privateKey = null
    }
  }

  if (profile.encryptedPrivateKey && !privateKey) {
    try {
      privateKey = decryptSecret(profile.encryptedPrivateKey)
    } catch {
      privateKey = null
    }
  }

  return {
    id: profile.id,
    name: profile.name,
    host: profile.host,
    port: profile.port,
    username: profile.username,
    authType: profile.authType,
    savePassword: profile.savePassword,
    savePassphrase: profile.savePassphrase,
    password,
    passphrase,
    privateKey,
    lastConnectedAt: profile.lastConnectedAt ?? null,
    updatedAt: profile.updatedAt,
  }
}

function profileToExportEntry(profile: ServerProfile, includeSecrets: boolean): ProfileExportEntry {
  const syncInput = localProfileToSyncInput(profile)

  return {
    name: syncInput.name,
    host: syncInput.host,
    port: syncInput.port,
    username: syncInput.username,
    authType: syncInput.authType,
    savePassword: syncInput.savePassword,
    savePassphrase: syncInput.savePassphrase,
    password: includeSecrets ? syncInput.password : null,
    passphrase: includeSecrets ? syncInput.passphrase : null,
    privateKey: includeSecrets ? syncInput.privateKey : null,
  }
}

function exportEntryToSaveRequest(entry: ProfileExportEntry): SaveProfileRequest {
  return {
    name: entry.name,
    host: entry.host,
    port: entry.port,
    username: entry.username,
    authType: entry.authType,
    savePassword: entry.savePassword,
    savePassphrase: entry.savePassphrase,
    password: entry.password ?? undefined,
    passphrase: entry.passphrase ?? undefined,
    privateKeyContent: entry.privateKey ?? undefined,
  }
}

export class ProfileManager {
  private cloudCache: ServerProfile[] = []

  isCloudMode(): boolean {
    return authStore.isAuthenticated()
  }

  async list(): Promise<PublicServerProfile[]> {
    if (!this.isCloudMode()) {
      return profileStore.list()
    }

    this.cloudCache = await cloudProfileService.listProfiles()
    return sortProfiles(this.cloudCache.map(toPublicProfile))
  }

  get(id: string): ServerProfile | null {
    if (this.isCloudMode()) {
      return this.cloudCache.find((profile) => profile.id === id) ?? null
    }

    return profileStore.get(id)
  }

  async save(request: SaveProfileRequest): Promise<PublicServerProfile> {
    if (!this.isCloudMode()) {
      return profileStore.save(request)
    }

    const profile = await cloudProfileService.saveProfile(request, request.id)
    const index = this.cloudCache.findIndex((item) => item.id === profile.id)

    if (index >= 0) {
      this.cloudCache[index] = profile
    } else {
      this.cloudCache.push(profile)
    }

    return toPublicProfile(profile)
  }

  async remove(id: string): Promise<void> {
    if (!this.isCloudMode()) {
      profileStore.remove(id)
      return
    }

    await cloudProfileService.removeProfile(id)
    this.cloudCache = this.cloudCache.filter((profile) => profile.id !== id)
  }

  async sync(): Promise<PublicServerProfile[]> {
    if (!this.isCloudMode()) {
      return profileStore.list()
    }

    return this.list()
  }

  listLocalMigrationCandidates(): ProfileMigrationCandidate[] {
    return profileStore.list().map((profile) => ({
      id: profile.id,
      name: profile.name,
      host: profile.host,
      port: profile.port,
      username: profile.username,
    }))
  }

  private async getAllServerProfiles(): Promise<ServerProfile[]> {
    if (!this.isCloudMode()) {
      return profileStore
        .list()
        .map((profile) => profileStore.get(profile.id))
        .filter((profile): profile is ServerProfile => Boolean(profile))
    }

    this.cloudCache = await cloudProfileService.listProfiles()
    return this.cloudCache
  }

  async buildExportBundle(includeSecrets: boolean): Promise<ProfileExportBundle> {
    const profiles = await this.getAllServerProfiles()

    return {
      version: 1,
      kind: 'terminalssh-profiles',
      exportedAt: new Date().toISOString(),
      includeSecrets,
      profiles: profiles.map((profile) => profileToExportEntry(profile, includeSecrets)),
    }
  }

  async importFromBundle(bundle: ProfileExportBundle): Promise<PublicServerProfile[]> {
    const imported: PublicServerProfile[] = []

    for (const entry of bundle.profiles) {
      imported.push(await this.save(exportEntryToSaveRequest(entry)))
    }

    return imported
  }

  async importLocalProfiles(): Promise<PublicServerProfile[]> {
    if (!this.isCloudMode()) {
      throw new Error('Buluta aktarmak için oturum açmalısınız.')
    }

    const localProfiles = profileStore.list()
      .map((publicProfile) => profileStore.get(publicProfile.id))
      .filter((profile): profile is ServerProfile => Boolean(profile))

    if (localProfiles.length === 0) {
      return this.list()
    }

    const payload = localProfiles.map(localProfileToSyncInput)
    this.cloudCache = await cloudProfileService.syncProfiles(payload)
    return sortProfiles(this.cloudCache.map(toPublicProfile))
  }

  async updateLastConnected(id: string): Promise<PublicServerProfile> {
    if (!this.isCloudMode()) {
      return profileStore.updateLastConnected(id)
    }

    await cloudProfileService.markConnected(id)
    const profile = this.cloudCache.find((item) => item.id === id)

    if (!profile) {
      throw new Error('Profil bulunamadı.')
    }

    profile.lastConnectedAt = new Date().toISOString()
    profile.updatedAt = profile.lastConnectedAt
    return toPublicProfile(profile)
  }

  resolvePassword(profile: ServerProfile, overridePassword?: string): string {
    if (overridePassword) {
      return overridePassword
    }

    if (!profile.encryptedPassword) {
      throw new Error('Parola gerekli.')
    }

    return decryptSecret(profile.encryptedPassword)
  }

  resolvePassphrase(profile: ServerProfile, overridePassphrase?: string): string | undefined {
    if (overridePassphrase) {
      return overridePassphrase
    }

    if (!profile.encryptedPassphrase) {
      return undefined
    }

    return decryptSecret(profile.encryptedPassphrase)
  }

  resolvePrivateKeyPath(profile: ServerProfile, overridePath?: string): string | undefined {
    if (overridePath) {
      return overridePath
    }

    return profile.privateKeyPath
  }

  resolvePrivateKeyContent(profile: ServerProfile): string | undefined {
    if (profile.privateKeyContent) {
      return profile.privateKeyContent
    }

    if (profile.encryptedPrivateKey) {
      return decryptSecret(profile.encryptedPrivateKey)
    }

    return undefined
  }
}

export const profileManager = new ProfileManager()
