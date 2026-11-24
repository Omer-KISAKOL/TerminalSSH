import type { FastifyReply, FastifyRequest } from 'fastify'

import { config } from '../config.js'
import { AuthError } from '../services/auth-service.js'
import { verifyAccessToken } from '../services/token-service.js'

function collectErrorText(error: Error): string {
  const parts: string[] = []

  if (error.message.trim()) {
    parts.push(error.message)
  }

  const aggregate = error as Error & { errors?: unknown[] }

  if (Array.isArray(aggregate.errors)) {
    for (const nested of aggregate.errors) {
      if (nested instanceof Error && nested.message.trim()) {
        parts.push(nested.message)
      }
    }
  }

  return parts.join(' ')
}

function isInfrastructureError(error: Error): boolean {
  const text = collectErrorText(error)

  return /password authentication failed|ECONNREFUSED|connection refused|getaddrinfo|timeout expired|terminating connection/i.test(
    text,
  )
}

function infrastructureMessage(error: Error): string {
  if (config.nodeEnv === 'production') {
    return 'Sunucu geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
  }

  if (isInfrastructureError(error)) {
    return 'Veritabanına bağlanılamadı. Docker Desktop açıkken `docker compose -f server/docker-compose.yml up -d` çalıştırın.'
  }

  const text = collectErrorText(error).trim()
  return text || 'Beklenmeyen bir hata oluştu.'
}

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string
    userEmail?: string
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Oturum gerekli.' })
  }

  const token = header.slice('Bearer '.length)

  try {
    const payload = verifyAccessToken(token)
    request.userId = payload.sub
    request.userEmail = payload.email
  } catch {
    return reply.code(401).send({ error: 'Oturum süresi doldu.' })
  }
}

export function handleAuthError(error: unknown): { statusCode: number; message: string } {
  if (error instanceof AuthError) {
    return { statusCode: 401, message: error.message }
  }

  if (error instanceof Error) {
    if (isInfrastructureError(error)) {
      return {
        statusCode: 503,
        message: infrastructureMessage(error),
      }
    }

    const message = collectErrorText(error).trim()
    return { statusCode: 400, message: message || 'İstek işlenemedi.' }
  }

  return { statusCode: 500, message: 'Beklenmeyen bir hata oluştu.' }
}
