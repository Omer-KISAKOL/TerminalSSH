import { createHash, randomBytes } from 'node:crypto'

import jwt, { type SignOptions } from 'jsonwebtoken'

import { config } from '../config.js'

export interface AccessTokenPayload {
  sub: string
  email: string
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function createAccessToken(payload: AccessTokenPayload): string {
  const signOptions: SignOptions = {
    expiresIn: config.jwtAccessTtl as SignOptions['expiresIn'],
  }

  return jwt.sign(payload, config.jwtSecret, signOptions)
}

export function createRefreshToken(): string {
  return randomBytes(48).toString('base64url')
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, config.jwtSecret)

  if (typeof decoded !== 'object' || decoded === null || !('sub' in decoded) || !('email' in decoded)) {
    throw new Error('Invalid access token payload.')
  }

  return {
    sub: String(decoded.sub),
    email: String(decoded.email),
  }
}

export function getRefreshExpiryDate(): Date {
  const ttl = config.jwtRefreshTtl
  const match = ttl.match(/^(\d+)([smhd])$/)

  if (!match) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }

  const amount = Number.parseInt(match[1] ?? '30', 10)
  const unit = match[2]

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }

  return new Date(Date.now() + amount * (multipliers[unit] ?? multipliers.d))
}
