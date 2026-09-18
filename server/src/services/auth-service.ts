import { randomUUID } from 'node:crypto'

import argon2 from 'argon2'

import { pool } from '../db/pool.js'
import type { UserRow } from '../types.js'
import {
  decryptDataKey,
  encryptDataKey,
  generateDataKey,
} from './crypto-service.js'
import {
  createAccessToken,
  createRefreshToken,
  getRefreshExpiryDate,
  hashToken,
} from './token-service.js'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

async function findUserByEmail(email: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [
    email.toLowerCase(),
  ])

  return result.rows[0] ?? null
}

async function findUserById(id: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id])
  return result.rows[0] ?? null
}

export async function registerUser(
  email: string,
  password: string,
  deviceName?: string,
): Promise<{ accessToken: string; refreshToken: string; user: { id: string; email: string } }> {
  const normalizedEmail = email.trim().toLowerCase()

  if (await findUserByEmail(normalizedEmail)) {
    throw new AuthError('Bu e-posta adresi zaten kayıtlı.')
  }

  const passwordHash = await argon2.hash(password)
  const dataKey = generateDataKey()
  const encryptedDataKey = encryptDataKey(dataKey)
  const userId = randomUUID()

  await pool.query(
    `INSERT INTO users (id, email, password_hash, encrypted_data_key)
     VALUES ($1, $2, $3, $4)`,
    [userId, normalizedEmail, passwordHash, encryptedDataKey],
  )

  return createSession(userId, normalizedEmail, deviceName)
}

export async function loginUser(
  email: string,
  password: string,
  deviceName?: string,
): Promise<{ accessToken: string; refreshToken: string; user: { id: string; email: string } }> {
  const user = await findUserByEmail(email.trim().toLowerCase())

  if (!user) {
    throw new AuthError('E-posta veya parola hatalı.')
  }

  const valid = await argon2.verify(user.password_hash, password)

  if (!valid) {
    throw new AuthError('E-posta veya parola hatalı.')
  }

  return createSession(user.id, user.email, deviceName)
}

async function createSession(
  userId: string,
  email: string,
  deviceName?: string,
): Promise<{ accessToken: string; refreshToken: string; user: { id: string; email: string } }> {
  const accessToken = createAccessToken({ sub: userId, email })
  const refreshToken = createRefreshToken()
  const refreshTokenHash = hashToken(refreshToken)
  const expiresAt = getRefreshExpiryDate()

  await pool.query(
    `INSERT INTO refresh_sessions (id, user_id, token_hash, device_name, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [randomUUID(), userId, refreshTokenHash, deviceName ?? null, expiresAt.toISOString()],
  )

  return {
    accessToken,
    refreshToken,
    user: { id: userId, email },
  }
}

export async function refreshSession(refreshToken: string): Promise<{
  accessToken: string
  refreshToken: string
  user: { id: string; email: string }
}> {
  const tokenHash = hashToken(refreshToken)
  const result = await pool.query<{
    id: string
    user_id: string
    email: string
    expires_at: Date
    revoked_at: Date | null
  }>(
    `SELECT rs.id, rs.user_id, u.email, rs.expires_at, rs.revoked_at
     FROM refresh_sessions rs
     JOIN users u ON u.id = rs.user_id
     WHERE rs.token_hash = $1`,
    [tokenHash],
  )

  const session = result.rows[0]

  if (!session || session.revoked_at || session.expires_at.getTime() < Date.now()) {
    throw new AuthError('Oturum süresi doldu. Lütfen tekrar giriş yapın.')
  }

  await pool.query('UPDATE refresh_sessions SET revoked_at = NOW() WHERE id = $1', [session.id])

  return createSession(session.user_id, session.email)
}

export async function logoutSession(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken)
  await pool.query('UPDATE refresh_sessions SET revoked_at = NOW() WHERE token_hash = $1', [
    tokenHash,
  ])
}

export async function getUserById(userId: string): Promise<{ id: string; email: string } | null> {
  const user = await findUserById(userId)

  if (!user) {
    return null
  }

  return { id: user.id, email: user.email }
}

export async function getUserDataKey(userId: string): Promise<Buffer> {
  const user = await findUserById(userId)

  if (!user) {
    throw new AuthError('Kullanıcı bulunamadı.')
  }

  return decryptDataKey(user.encrypted_data_key)
}
