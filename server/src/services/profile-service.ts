import { randomUUID } from 'node:crypto'

import { pool } from '../db/pool.js'
import type { ProfileResponse, ProfileRow, SyncProfileInput } from '../types.js'
import { decryptSecret, encryptSecret } from './crypto-service.js'
import { getUserDataKey } from './auth-service.js'

function mapProfileRow(
  row: ProfileRow,
  dataKey: Buffer,
  includeSecrets: boolean,
): ProfileResponse {
  const password = includeSecrets ? decryptSecret(dataKey, row.encrypted_password) : null
  const passphrase = includeSecrets ? decryptSecret(dataKey, row.encrypted_passphrase) : null
  const privateKey = includeSecrets ? decryptSecret(dataKey, row.encrypted_private_key) : null

  return {
    id: row.id,
    name: row.name,
    host: row.host,
    port: row.port,
    username: row.username,
    authType: row.auth_type,
    savePassword: row.save_password,
    savePassphrase: row.save_passphrase,
    hasSavedPassword: Boolean(row.encrypted_password),
    hasSavedPassphrase: Boolean(row.encrypted_passphrase),
    hasSavedPrivateKey: Boolean(row.encrypted_private_key),
    password: includeSecrets ? password : undefined,
    passphrase: includeSecrets ? passphrase : undefined,
    privateKey: includeSecrets ? privateKey : undefined,
    lastConnectedAt: row.last_connected_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    deletedAt: row.deleted_at?.toISOString() ?? null,
  }
}

async function getProfileRow(userId: string, profileId: string): Promise<ProfileRow | null> {
  const result = await pool.query<ProfileRow>(
    `SELECT * FROM server_profiles
     WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL`,
    [userId, profileId],
  )

  return result.rows[0] ?? null
}

function buildSecretFields(
  dataKey: Buffer,
  input: {
    authType: 'password' | 'privateKey'
    savePassword: boolean
    savePassphrase: boolean
    password?: string | null
    passphrase?: string | null
    privateKey?: string | null
  },
  existing?: ProfileRow | null,
) {
  let encryptedPassword = existing?.encrypted_password ?? null
  let encryptedPassphrase = existing?.encrypted_passphrase ?? null
  let encryptedPrivateKey = existing?.encrypted_private_key ?? null

  if (input.authType === 'password') {
    encryptedPassphrase = null
    encryptedPrivateKey = null

    if (input.savePassword && input.password) {
      encryptedPassword = encryptSecret(dataKey, input.password)
    } else if (!input.savePassword) {
      encryptedPassword = null
    }
  } else {
    encryptedPassword = null

    if (input.privateKey) {
      encryptedPrivateKey = encryptSecret(dataKey, input.privateKey)
    }

    if (input.savePassphrase && input.passphrase) {
      encryptedPassphrase = encryptSecret(dataKey, input.passphrase)
    } else if (!input.savePassphrase) {
      encryptedPassphrase = null
    }
  }

  return { encryptedPassword, encryptedPassphrase, encryptedPrivateKey }
}

export async function listProfiles(userId: string): Promise<ProfileResponse[]> {
  const dataKey = await getUserDataKey(userId)
  const result = await pool.query<ProfileRow>(
    `SELECT * FROM server_profiles
     WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY last_connected_at DESC NULLS LAST, name ASC`,
    [userId],
  )

  return result.rows.map((row) => mapProfileRow(row, dataKey, true))
}

export async function createProfile(
  userId: string,
  input: Omit<SyncProfileInput, 'id' | 'updatedAt' | 'deletedAt'>,
): Promise<ProfileResponse> {
  const dataKey = await getUserDataKey(userId)
  const id = randomUUID()
  const now = new Date().toISOString()
  const secrets = buildSecretFields(dataKey, input)

  const result = await pool.query<ProfileRow>(
    `INSERT INTO server_profiles (
      id, user_id, name, host, port, username, auth_type,
      save_password, save_passphrase,
      encrypted_password, encrypted_passphrase, encrypted_private_key,
      last_connected_at, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7,
      $8, $9,
      $10, $11, $12,
      $13, $14, $15
    ) RETURNING *`,
    [
      id,
      userId,
      input.name,
      input.host,
      input.port,
      input.username,
      input.authType,
      input.savePassword,
      input.savePassphrase,
      secrets.encryptedPassword,
      secrets.encryptedPassphrase,
      secrets.encryptedPrivateKey,
      input.lastConnectedAt ?? null,
      now,
      now,
    ],
  )

  return mapProfileRow(result.rows[0]!, dataKey, true)
}

export async function updateProfile(
  userId: string,
  profileId: string,
  input: Partial<SyncProfileInput>,
): Promise<ProfileResponse> {
  const existing = await getProfileRow(userId, profileId)

  if (!existing) {
    throw new Error('Profil bulunamadı.')
  }

  const dataKey = await getUserDataKey(userId)
  const secrets = buildSecretFields(
    dataKey,
    {
      authType: input.authType ?? existing.auth_type,
      savePassword: input.savePassword ?? existing.save_password,
      savePassphrase: input.savePassphrase ?? existing.save_passphrase,
      password: input.password,
      passphrase: input.passphrase,
      privateKey: input.privateKey,
    },
    existing,
  )

  const result = await pool.query<ProfileRow>(
    `UPDATE server_profiles SET
      name = $3,
      host = $4,
      port = $5,
      username = $6,
      auth_type = $7,
      save_password = $8,
      save_passphrase = $9,
      encrypted_password = $10,
      encrypted_passphrase = $11,
      encrypted_private_key = $12,
      last_connected_at = COALESCE($13, last_connected_at),
      updated_at = NOW()
     WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL
     RETURNING *`,
    [
      userId,
      profileId,
      input.name ?? existing.name,
      input.host ?? existing.host,
      input.port ?? existing.port,
      input.username ?? existing.username,
      input.authType ?? existing.auth_type,
      input.savePassword ?? existing.save_password,
      input.savePassphrase ?? existing.save_passphrase,
      secrets.encryptedPassword,
      secrets.encryptedPassphrase,
      secrets.encryptedPrivateKey,
      input.lastConnectedAt ?? null,
    ],
  )

  return mapProfileRow(result.rows[0]!, dataKey, true)
}

export async function deleteProfile(userId: string, profileId: string): Promise<void> {
  await pool.query(
    `UPDATE server_profiles SET deleted_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL`,
    [userId, profileId],
  )
}

export async function syncProfiles(
  userId: string,
  profiles: SyncProfileInput[],
): Promise<ProfileResponse[]> {
  const dataKey = await getUserDataKey(userId)

  for (const profile of profiles) {
    const existingResult = await pool.query<ProfileRow>(
      'SELECT * FROM server_profiles WHERE user_id = $1 AND id = $2',
      [userId, profile.id],
    )
    const existing = existingResult.rows[0] ?? null

    if (profile.deletedAt) {
      if (existing) {
        await pool.query(
          `UPDATE server_profiles SET deleted_at = $3, updated_at = $3
           WHERE user_id = $1 AND id = $2`,
          [userId, profile.id, profile.deletedAt],
        )
      }

      continue
    }

    const secrets = buildSecretFields(dataKey, profile, existing)
    const updatedAt = profile.updatedAt

    if (!existing) {
      await pool.query(
        `INSERT INTO server_profiles (
          id, user_id, name, host, port, username, auth_type,
          save_password, save_passphrase,
          encrypted_password, encrypted_passphrase, encrypted_private_key,
          last_connected_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9,
          $10, $11, $12,
          $13, $14, $15
        )`,
        [
          profile.id,
          userId,
          profile.name,
          profile.host,
          profile.port,
          profile.username,
          profile.authType,
          profile.savePassword,
          profile.savePassphrase,
          secrets.encryptedPassword,
          secrets.encryptedPassphrase,
          secrets.encryptedPrivateKey,
          profile.lastConnectedAt ?? null,
          updatedAt,
          updatedAt,
        ],
      )
      continue
    }

    const existingUpdatedAt = existing.updated_at.toISOString()
    const incomingUpdatedAt = new Date(profile.updatedAt).toISOString()

    if (incomingUpdatedAt <= existingUpdatedAt) {
      continue
    }

    await pool.query(
      `UPDATE server_profiles SET
        name = $3,
        host = $4,
        port = $5,
        username = $6,
        auth_type = $7,
        save_password = $8,
        save_passphrase = $9,
        encrypted_password = $10,
        encrypted_passphrase = $11,
        encrypted_private_key = $12,
        last_connected_at = COALESCE($13, last_connected_at),
        updated_at = $14,
        deleted_at = NULL
       WHERE user_id = $1 AND id = $2`,
      [
        userId,
        profile.id,
        profile.name,
        profile.host,
        profile.port,
        profile.username,
        profile.authType,
        profile.savePassword,
        profile.savePassphrase,
        secrets.encryptedPassword,
        secrets.encryptedPassphrase,
        secrets.encryptedPrivateKey,
        profile.lastConnectedAt ?? null,
        updatedAt,
      ],
    )
  }

  return listProfiles(userId)
}

export async function updateLastConnected(userId: string, profileId: string): Promise<void> {
  await pool.query(
    `UPDATE server_profiles SET last_connected_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL`,
    [userId, profileId],
  )
}
