import { randomUUID } from 'node:crypto'

import argon2 from 'argon2'

import {
  isSecurityQuestionId,
  normalizeSecurityAnswer,
  type SecurityQuestionId,
} from '../constants/security-questions.js'
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
  createSecuritySetupToken,
  getRefreshExpiryDate,
  hashToken,
  verifySecuritySetupToken,
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

export function userNeedsSecuritySetup(user: UserRow): boolean {
  return (
    !user.security_question_id ||
    !user.security_answer_hash ||
    !isSecurityQuestionId(user.security_question_id)
  )
}

async function setUserSecurityQuestion(
  userId: string,
  securityQuestionId: SecurityQuestionId,
  securityAnswer: string,
): Promise<void> {
  if (!isSecurityQuestionId(securityQuestionId)) {
    throw new AuthError('Geçerli bir güvenlik sorusu seçin.')
  }

  const securityAnswerHash = await argon2.hash(normalizeSecurityAnswer(securityAnswer))

  await pool.query(
    `UPDATE users
     SET security_question_id = $2,
         security_answer_hash = $3,
         updated_at = NOW()
     WHERE id = $1`,
    [userId, securityQuestionId, securityAnswerHash],
  )
}

export async function registerUser(
  email: string,
  password: string,
  securityQuestionId: SecurityQuestionId,
  securityAnswer: string,
  deviceName?: string,
): Promise<{ accessToken: string; refreshToken: string; user: { id: string; email: string } }> {
  const normalizedEmail = email.trim().toLowerCase()

  if (await findUserByEmail(normalizedEmail)) {
    throw new AuthError('Bu e-posta adresi zaten kayıtlı.')
  }

  if (!isSecurityQuestionId(securityQuestionId)) {
    throw new AuthError('Geçerli bir güvenlik sorusu seçin.')
  }

  const passwordHash = await argon2.hash(password)
  const securityAnswerHash = await argon2.hash(normalizeSecurityAnswer(securityAnswer))
  const dataKey = generateDataKey()
  const encryptedDataKey = encryptDataKey(dataKey)
  const userId = randomUUID()

  await pool.query(
    `INSERT INTO users (
      id, email, password_hash, encrypted_data_key, security_question_id, security_answer_hash
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, normalizedEmail, passwordHash, encryptedDataKey, securityQuestionId, securityAnswerHash],
  )

  return createSession(userId, normalizedEmail, deviceName)
}

export async function getPasswordResetQuestion(
  email: string,
): Promise<{ securityQuestionId: SecurityQuestionId }> {
  const user = await findUserByEmail(email.trim().toLowerCase())

  if (
    !user?.security_question_id ||
    !user.security_answer_hash ||
    !isSecurityQuestionId(user.security_question_id)
  ) {
    throw new AuthError('Bu e-posta için parola sıfırlama yapılamıyor.')
  }

  return { securityQuestionId: user.security_question_id }
}

export async function resetPasswordWithSecurityAnswer(
  email: string,
  securityAnswer: string,
  newPassword: string,
): Promise<void> {
  const user = await findUserByEmail(email.trim().toLowerCase())

  if (!user?.security_answer_hash) {
    throw new AuthError('Güvenlik sorusunun cevabı hatalı.')
  }

  const valid = await argon2.verify(user.security_answer_hash, normalizeSecurityAnswer(securityAnswer))

  if (!valid) {
    throw new AuthError('Güvenlik sorusunun cevabı hatalı.')
  }

  const reusingCurrentPassword = await argon2.verify(user.password_hash, newPassword)

  if (reusingCurrentPassword) {
    throw new AuthError('Yeni parola mevcut parolanızdan farklı olmalıdır.')
  }

  const passwordHash = await argon2.hash(newPassword)

  await pool.query(
    `UPDATE users
     SET password_hash = $2, updated_at = NOW()
     WHERE id = $1`,
    [user.id, passwordHash],
  )

  await pool.query(
    `UPDATE refresh_sessions
     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [user.id],
  )
}

export type LoginUserResult =
  | {
      requiresSecuritySetup: false
      accessToken: string
      refreshToken: string
      user: { id: string; email: string }
    }
  | {
      requiresSecuritySetup: true
      setupToken: string
      user: { id: string; email: string }
    }

export async function loginUser(
  email: string,
  password: string,
  deviceName?: string,
): Promise<LoginUserResult> {
  const user = await findUserByEmail(email.trim().toLowerCase())

  if (!user) {
    throw new AuthError('E-posta veya parola hatalı.')
  }

  const valid = await argon2.verify(user.password_hash, password)

  if (!valid) {
    throw new AuthError('E-posta veya parola hatalı.')
  }

  if (userNeedsSecuritySetup(user)) {
    return {
      requiresSecuritySetup: true,
      setupToken: createSecuritySetupToken({ sub: user.id, email: user.email }),
      user: { id: user.id, email: user.email },
    }
  }

  const session = await createSession(user.id, user.email, deviceName)

  return {
    requiresSecuritySetup: false,
    ...session,
  }
}

export async function completeSecuritySetupWithToken(
  setupToken: string,
  securityQuestionId: SecurityQuestionId,
  securityAnswer: string,
  deviceName?: string,
): Promise<{ accessToken: string; refreshToken: string; user: { id: string; email: string } }> {
  let payload: { sub: string; email: string }

  try {
    payload = verifySecuritySetupToken(setupToken)
  } catch {
    throw new AuthError('Güvenlik sorusu kurulumunun süresi doldu. Lütfen tekrar giriş yapın.')
  }

  const user = await findUserById(payload.sub)

  if (!user || user.email !== payload.email) {
    throw new AuthError('Kullanıcı bulunamadı.')
  }

  if (!userNeedsSecuritySetup(user)) {
    throw new AuthError('Güvenlik sorusu zaten tanımlı.')
  }

  await setUserSecurityQuestion(user.id, securityQuestionId, securityAnswer)

  return createSession(user.id, user.email, deviceName)
}

export async function completeSecuritySetupForUser(
  userId: string,
  securityQuestionId: SecurityQuestionId,
  securityAnswer: string,
): Promise<void> {
  const user = await findUserById(userId)

  if (!user) {
    throw new AuthError('Kullanıcı bulunamadı.')
  }

  if (!userNeedsSecuritySetup(user)) {
    throw new AuthError('Güvenlik sorusu zaten tanımlı.')
  }

  await setUserSecurityQuestion(user.id, securityQuestionId, securityAnswer)
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

  const accessToken = createAccessToken({ sub: session.user_id, email: session.email })
  const nextRefreshToken = createRefreshToken()
  const nextRefreshHash = hashToken(nextRefreshToken)
  const expiresAt = getRefreshExpiryDate()

  await pool.query(
    `UPDATE refresh_sessions
     SET token_hash = $1, expires_at = $2
     WHERE id = $3`,
    [nextRefreshHash, expiresAt.toISOString(), session.id],
  )

  return {
    accessToken,
    refreshToken: nextRefreshToken,
    user: { id: session.user_id, email: session.email },
  }
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

export async function getAuthenticatedUserInfo(userId: string): Promise<{
  user: { id: string; email: string }
  requiresSecuritySetup: boolean
} | null> {
  const user = await findUserById(userId)

  if (!user) {
    return null
  }

  return {
    user: { id: user.id, email: user.email },
    requiresSecuritySetup: userNeedsSecuritySetup(user),
  }
}

export async function getUserDataKey(userId: string): Promise<Buffer> {
  const user = await findUserById(userId)

  if (!user) {
    throw new AuthError('Kullanıcı bulunamadı.')
  }

  return decryptDataKey(user.encrypted_data_key)
}
