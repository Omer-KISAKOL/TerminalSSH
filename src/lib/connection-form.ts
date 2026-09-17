import type { PublicServerProfile } from '@shared/contracts/profile'
import type { ConnectionFormValues } from '@shared/contracts/ssh'

export const DEFAULT_CONNECTION_FORM: ConnectionFormValues = {
  name: '',
  host: '',
  port: '22',
  username: '',
  authType: 'password',
  password: '',
  privateKeyPath: '',
  passphrase: '',
  savePassword: false,
  savePassphrase: false,
  saveProfile: false,
  hasSavedPassword: false,
  hasSavedPassphrase: false,
}

export function publicProfileToFormValues(profile: PublicServerProfile): ConnectionFormValues {
  return {
    profileId: profile.id,
    name: profile.name,
    host: profile.host,
    port: String(profile.port),
    username: profile.username,
    authType: profile.authType,
    password: '',
    privateKeyPath: profile.privateKeyPath ?? '',
    passphrase: '',
    savePassword: profile.savePassword,
    savePassphrase: profile.savePassphrase,
    saveProfile: true,
    hasSavedPassword: profile.hasSavedPassword,
    hasSavedPassphrase: profile.hasSavedPassphrase,
  }
}

export function validateConnectionForm(values: ConnectionFormValues): string | null {
  if (values.saveProfile && values.name.trim().length === 0) {
    return 'Profil adı boş olamaz.'
  }

  if (values.host.trim().length === 0) {
    return 'Sunucu adresi boş olamaz.'
  }

  const port = Number.parseInt(values.port, 10)

  if (Number.isNaN(port) || port < 1 || port > 65535) {
    return 'Port 1–65535 arasında olmalı.'
  }

  if (values.username.trim().length === 0) {
    return 'Kullanıcı adı boş olamaz.'
  }

  if (values.authType === 'password') {
    if (!values.hasSavedPassword && values.password.length === 0) {
      return 'Parola boş olamaz.'
    }

    if (values.savePassword && values.password.length === 0 && !values.hasSavedPassword) {
      return 'Parolayı kaydetmek için parola girilmeli.'
    }
  }

  if (values.authType === 'privateKey') {
    if (values.privateKeyPath.trim().length === 0) {
      return 'Özel anahtar dosyası seçilmeli.'
    }

    if (values.savePassphrase && values.passphrase.length === 0 && !values.hasSavedPassphrase) {
      return 'Passphrase kaydetmek için passphrase girilmeli.'
    }
  }

  return null
}

export function getConnectionLabel(values: ConnectionFormValues): string {
  if (values.name.trim().length > 0) {
    return values.name.trim()
  }

  return `${values.username}@${values.host}:${values.port}`
}

export function getLastConnectedProfileId(profiles: PublicServerProfile[]): string | null {
  if (profiles.length === 0) {
    return null
  }

  const sorted = [...profiles].sort((left, right) => {
    const leftTime = left.lastConnectedAt ? Date.parse(left.lastConnectedAt) : 0
    const rightTime = right.lastConnectedAt ? Date.parse(right.lastConnectedAt) : 0
    return rightTime - leftTime
  })

  return sorted[0]?.lastConnectedAt ? sorted[0].id : null
}
