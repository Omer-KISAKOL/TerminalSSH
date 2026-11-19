import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'

import { config } from '../config.js'
import { handleAuthError, requireAuth } from '../middleware/auth.js'
import {
  completeSecuritySetupForUser,
  completeSecuritySetupWithToken,
  getAuthenticatedUserInfo,
  getPasswordResetQuestion,
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
  resetPasswordWithSecurityAnswer,
} from '../services/auth-service.js'
import {
  loginSchema,
  passwordResetConfirmSchema,
  passwordResetQuestionSchema,
  refreshSchema,
  registerSchema,
  securitySetupAuthenticatedSchema,
  securitySetupWithTokenSchema,
} from '../validation.js'

export async function registerAuthRoutes(app: FastifyInstance) {
  await app.register(async (authApp) => {
    await authApp.register(rateLimit, {
      max: config.nodeEnv === 'production' ? 20 : 500,
      timeWindow: '1 minute',
    })

    authApp.post('/auth/register', async (request, reply) => {
      try {
        const body = registerSchema.parse(request.body)
        const session = await registerUser(
          body.email,
          body.password,
          body.securityQuestionId,
          body.securityAnswer,
          body.deviceName,
        )
        return reply.code(201).send(session)
      } catch (error) {
        if (error instanceof ZodError) {
          const message = error.issues[0]?.message ?? 'Geçersiz kayıt isteği.'
          return reply.code(400).send({ error: message })
        }

        const handled = handleAuthError(error)
        return reply.code(handled.statusCode).send({ error: handled.message })
      }
    })

    authApp.post('/auth/password-reset/question', async (request, reply) => {
      try {
        const body = passwordResetQuestionSchema.parse(request.body)
        const result = await getPasswordResetQuestion(body.email)
        return result
      } catch (error) {
        const handled = handleAuthError(error)
        return reply.code(handled.statusCode).send({ error: handled.message })
      }
    })

    authApp.post('/auth/password-reset/confirm', async (request, reply) => {
      try {
        const body = passwordResetConfirmSchema.parse(request.body)
        await resetPasswordWithSecurityAnswer(body.email, body.securityAnswer, body.newPassword)
        return { ok: true }
      } catch (error) {
        const handled = handleAuthError(error)
        return reply.code(handled.statusCode).send({ error: handled.message })
      }
    })

    authApp.post('/auth/login', async (request, reply) => {
      try {
        const body = loginSchema.parse(request.body)
        const result = await loginUser(body.email, body.password, body.deviceName)

        if (result.requiresSecuritySetup) {
          return reply.code(200).send({
            requiresSecuritySetup: true,
            setupToken: result.setupToken,
            user: result.user,
          })
        }

        return {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        }
      } catch (error) {
        const handled = handleAuthError(error)
        return reply.code(handled.statusCode).send({ error: handled.message })
      }
    })

    authApp.post('/auth/security-setup', async (request, reply) => {
      try {
        const body = securitySetupWithTokenSchema.parse(request.body)
        const session = await completeSecuritySetupWithToken(
          body.setupToken,
          body.securityQuestionId,
          body.securityAnswer,
          body.deviceName,
        )
        return reply.code(200).send(session)
      } catch (error) {
        if (error instanceof ZodError) {
          const message = error.issues[0]?.message ?? 'Geçersiz güvenlik sorusu isteği.'
          return reply.code(400).send({ error: message })
        }

        const handled = handleAuthError(error)
        return reply.code(handled.statusCode).send({ error: handled.message })
      }
    })

    authApp.post(
      '/auth/security-setup/complete',
      { preHandler: requireAuth },
      async (request, reply) => {
        try {
          const body = securitySetupAuthenticatedSchema.parse(request.body)
          await completeSecuritySetupForUser(
            request.userId!,
            body.securityQuestionId,
            body.securityAnswer,
          )
          return { ok: true }
        } catch (error) {
          if (error instanceof ZodError) {
            const message = error.issues[0]?.message ?? 'Geçersiz güvenlik sorusu isteği.'
            return reply.code(400).send({ error: message })
          }

          const handled = handleAuthError(error)
          return reply.code(handled.statusCode).send({ error: handled.message })
        }
      },
    )

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
      const info = await getAuthenticatedUserInfo(request.userId!)

      if (!info) {
        return reply.code(404).send({ error: 'Kullanıcı bulunamadı.' })
      }

      return info
    })
  })
}
