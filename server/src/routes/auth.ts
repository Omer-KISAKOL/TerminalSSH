import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'

import { config } from '../config.js'
import { handleAuthError, requireAuth } from '../middleware/auth.js'
import {
  getUserById,
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
} from '../services/auth-service.js'
import { loginSchema, refreshSchema, registerSchema } from '../validation.js'

export async function registerAuthRoutes(app: FastifyInstance) {
  await app.register(async (authApp) => {
    await authApp.register(rateLimit, {
      max: config.nodeEnv === 'production' ? 20 : 500,
      timeWindow: '1 minute',
    })

    authApp.post('/auth/register', async (request, reply) => {
      try {
        const body = registerSchema.parse(request.body)
        const session = await registerUser(body.email, body.password, body.deviceName)
        return reply.code(201).send(session)
      } catch (error) {
        const handled = handleAuthError(error)
        return reply.code(handled.statusCode).send({ error: handled.message })
      }
    })

    authApp.post('/auth/login', async (request, reply) => {
      try {
        const body = loginSchema.parse(request.body)
        const session = await loginUser(body.email, body.password, body.deviceName)
        return session
      } catch (error) {
        const handled = handleAuthError(error)
        return reply.code(handled.statusCode).send({ error: handled.message })
      }
    })

    authApp.post('/auth/refresh', async (request, reply) => {
      try {
        const body = refreshSchema.parse(request.body)
        const session = await refreshSession(body.refreshToken)
        return session
      } catch (error) {
        const handled = handleAuthError(error)
        return reply.code(handled.statusCode).send({ error: handled.message })
      }
    })

    authApp.post('/auth/logout', async (request, reply) => {
      try {
        const body = refreshSchema.parse(request.body)
        await logoutSession(body.refreshToken)
        return { ok: true }
      } catch (error) {
        const handled = handleAuthError(error)
        return reply.code(handled.statusCode).send({ error: handled.message })
      }
    })

    authApp.get('/auth/me', { preHandler: requireAuth }, async (request, reply) => {
      const user = await getUserById(request.userId!)

      if (!user) {
        return reply.code(404).send({ error: 'Kullanıcı bulunamadı.' })
      }

      return { user }
    })
  })
}
