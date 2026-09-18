import { config as loadEnv } from 'dotenv'

loadEnv()

function required(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function parseMasterKey(raw: string): Buffer {
  const key = Buffer.from(raw, 'hex')

  if (key.length !== 32) {
    throw new Error('SERVER_MASTER_KEY must be 32 bytes (64 hex characters).')
  }

  return key
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.PORT ?? '8787', 10),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtAccessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  serverMasterKey: parseMasterKey(required('SERVER_MASTER_KEY')),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}
