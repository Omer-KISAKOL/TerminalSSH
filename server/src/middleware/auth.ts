import type { FastifyReply, FastifyRequest } from 'fastify'

import { AuthError } from '../services/auth-service.js'
import { verifyAccessToken } from '../services/token-service.js'

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
    return { statusCode: 400, message: error.message }
  }

  return { statusCode: 500, message: 'Beklenmeyen bir hata oluştu.' }
}
