import { randomUUID } from 'node:crypto'

import Store from 'electron-store'

import type {
  PublicServerProfile,
  SaveProfileRequest,
  ServerProfile,
} from '@shared/contracts/profile'

import { logger } from './logger'
import {
  decryptSecret,
  encryptSecret,
  SecretStoreError,
  assertCanStoreSecrets,
} from './secret-store'

interface ProfileStoreSchema {
  profiles: ServerProfile[]
}

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
  }
}

export class ProfileStore {
  private readonly store = new Store<ProfileStoreSchema>({
    name: 'terminalssh-profiles',
    defaults: {
      profiles: [],
    },
  })

  list(): PublicServerProfile[] {
    const profiles = this.store.get('profiles')
    return profiles.map(toPublicProfile).sort((left, right) => {
      const leftTime = left.lastConnectedAt ? Date.parse(left.lastConnectedAt) : 0
      const rightTime = right.lastConnectedAt ? Date.parse(right.lastConnectedAt) : 0

      if (leftTime !== rightTime) {
        return rightTime - leftTime
      }

      return left.name.localeCompare(right.name, 'tr')
    })
  }

  get(id: string): ServerProfile | null {
    return this.store.get('profiles').find((profile) => profile.id === id) ?? null
  }

  save(request: SaveProfileRequest): PublicServerProfile {
    const now = new Date().toISOString()
    const existing = request.id ? this.get(request.id) : null
    const profile: ServerProfile = existing
      ? { ...existing }
      : {
          id: randomUUID(),
          name: request.name,
          host: request.host,
          port: request.port,
          username: request.username,
          authType: request.authType,
          savePassword: false,
          savePassphrase: false,
          createdAt: now,
          updatedAt: now,
        }

    profile.name = request.name
    profile.host = request.host
    profile.port = request.port
    profile.username = request.username
    profile.authType = request.authType
    profile.privateKeyPath = request.authType === 'privateKey' ? request.privateKeyPath : undefined
    profile.savePassword = request.savePassword
    profile.savePassphrase = request.savePassphrase
    profile.updatedAt = now

    try {
      if (request.authType === 'password') {
        profile.encryptedPassphrase = undefined
        profile.savePassphrase = false

        if (request.savePassword) {
          assertCanStoreSecrets()

          if (!request.password) {
            if (!profile.encryptedPassword) {
              throw new SecretStoreError(
                'Parola kaydetmek için parola girilmeli veya mevcut kayıtlı parola korunmalı.',
              )
            }
          } else {
            profile.encryptedPassword = encryptSecret(request.password)
          }
        } else {
          profile.encryptedPassword = undefined
        }
      }

      if (request.authType === 'privateKey') {
        profile.encryptedPassword = undefined
        profile.savePassword = false

        if (request.savePassphrase) {
          assertCanStoreSecrets()

          if (!request.passphrase) {
            if (!profile.encryptedPassphrase) {
              throw new SecretStoreError(
                'Passphrase kaydetmek için passphrase girilmeli veya mevcut kayıtlı passphrase korunmalı.',
              )
            }
          } else {
            profile.encryptedPassphrase = encryptSecret(request.passphrase)
          }
        } else {
          profile.encryptedPassphrase = undefined
        }
      }
    } catch (error) {
      if (error instanceof SecretStoreError) {
        throw error
      }

      throw new SecretStoreError('Hassas bilgiler kaydedilemedi.')
    }

    const profiles = this.store.get('profiles')

    if (existing) {
      this.store.set(
        'profiles',
        profiles.map((item) => (item.id === profile.id ? profile : item)),
      )
    } else {
      this.store.set('profiles', [...profiles, profile])
    }

    logger.info('Profil kaydedildi', {
      profileId: profile.id,
      host: profile.host,
      port: profile.port,
      username: profile.username,
      authType: profile.authType,
    })

    return toPublicProfile(profile)
  }

  remove(id: string): void {
    const profiles = this.store.get('profiles')
    const nextProfiles = profiles.filter((profile) => profile.id !== id)

    if (nextProfiles.length === profiles.length) {
      throw new Error('Profil bulunamadı.')
    }

    this.store.set('profiles', nextProfiles)
    logger.info('Profil silindi', { profileId: id })
  }

  updateLastConnected(id: string): PublicServerProfile {
    const profile = this.get(id)

    if (!profile) {
      throw new Error('Profil bulunamadı.')
    }

    const updatedProfile: ServerProfile = {
      ...profile,
      lastConnectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.store.set(
      'profiles',
      this.store.get('profiles').map((item) => (item.id === id ? updatedProfile : item)),
    )

    return toPublicProfile(updatedProfile)
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
}

export const profileStore = new ProfileStore()
