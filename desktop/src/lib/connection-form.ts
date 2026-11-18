import { MAX_PORT, MIN_PORT } from '@shared/constants/validation'
import type { ProfileEditSecrets, PublicServerProfile } from '@shared/contracts/profile'
import type { ConnectionFormValues } from '@shared/contracts/ssh'

import {
  validationMessagesTr,
  type ValidationMessages,
} from '@shared/i18n/validation-messages'

export const DEFAULT_CONNECTION_FORM: ConnectionFormValues = {
  name: '',
  host: '',
  port: '22',
  username: '',
  authType: 'password',
  password: '',
  privateKeyPath: '',
  passphrase: '',
  savePassword: true,
  savePassphrase: false,
  saveProfile: true,
  hasSavedPassword: false,
  hasSavedPassphrase: false,
}

export function publicProfileToFormValues(
  profile: PublicServerProfile,
  secrets?: ProfileEditSecrets,
): ConnectionFormValues {
  const password = secrets?.password ?? ''
  const passphrase = secrets?.passphrase ?? ''

  return {
    profileId: profile.id,
    name: profile.name,
    host: profile.host,
    port: String(profile.port),
    username: profile.username,
    authType: profile.authType,
    password,
    privateKeyPath: profile.privateKeyPath ?? '',
    passphrase,
    savePassword: profile.savePassword,
    savePassphrase: profile.savePassphrase,
    saveProfile: true,
    hasSavedPassword: profile.hasSavedPassword || password.length > 0,
    hasSavedPassphrase: profile.hasSavedPassphrase || passphrase.length > 0,
  }
}

export function validateConnectionForm(
  values: ConnectionFormValues,
  validation: ValidationMessages = validationMessagesTr,
): string | null {
  if (values.saveProfile && values.name.trim().length === 0) {
    return validation.profileNameRequired
  }

  if (values.host.trim().length === 0) {
    return validation.hostRequired
  }

  const portText = values.port.trim()

  if (!/^\d+$/.test(portText)) {
    return validation.portNumeric
  }

  const port = Number.parseInt(portText, 10)

  if (Number.isNaN(port) || port < MIN_PORT || port > MAX_PORT) {
    return validation.portRange
      .replace('{min}', String(MIN_PORT))
      .replace('{max}', String(MAX_PORT))
  }

  if (values.username.trim().length === 0) {
    return validation.usernameRequired
  }

  if (values.authType === 'password') {
    if (!values.hasSavedPassword && values.password.length === 0) {
      return validation.passwordRequired
    }

    if (values.savePassword && values.password.length === 0 && !values.hasSavedPassword) {
      return validation.passwordSaveRequired
    }
  }

  if (values.authType === 'privateKey') {
    if (values.privateKeyPath.trim().length === 0) {
      return validation.privateKeyRequired
    }

    if (values.savePassphrase && values.passphrase.length === 0 && !values.hasSavedPassphrase) {
      return validation.passphraseSaveRequired
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
