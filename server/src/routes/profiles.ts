import type { FastifyInstance } from 'fastify'

import { handleAuthError, requireAuth } from '../middleware/auth.js'
import {
  createProfile,
  deleteProfile,
  listProfiles,
  syncProfiles,
  updateLastConnected,
  updateProfile,
} from '../services/profile-service.js'
import { profileInputSchema, syncSchema } from '../validation.js'

export async function registerProfileRoutes(app: FastifyInstance) {
  app.get('/profiles', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const profiles = await listProfiles(request.userId!)
      return { profiles }
    } catch (error) {
      const handled = handleAuthError(error)
      return reply.code(handled.statusCode).send({ error: handled.message })
    }
  })

  app.post('/profiles', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const body = profileInputSchema.parse(request.body)
      const profile = await createProfile(request.userId!, body)
      return { profile }
    } catch (error) {
      const handled = handleAuthError(error)
      return reply.code(handled.statusCode).send({ error: handled.message })
    }
  })

  app.put('/profiles/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const params = request.params as { id: string }
      const body = profileInputSchema.partial().parse(request.body)
      const profile = await updateProfile(request.userId!, params.id, body)
      return { profile }
    } catch (error) {
      const handled = handleAuthError(error)
      return reply.code(handled.statusCode).send({ error: handled.message })
    }
  })

  app.delete('/profiles/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const params = request.params as { id: string }
      await deleteProfile(request.userId!, params.id)
      return { ok: true }
    } catch (error) {
      const handled = handleAuthError(error)
      return reply.code(handled.statusCode).send({ error: handled.message })
    }
  })

  app.post('/profiles/sync', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const body = syncSchema.parse(request.body)
      const profiles = await syncProfiles(request.userId!, body.profiles)
      return { profiles }
    } catch (error) {
      const handled = handleAuthError(error)
      return reply.code(handled.statusCode).send({ error: handled.message })
    }
  })

  app.post('/profiles/:id/connected', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const params = request.params as { id: string }
      await updateLastConnected(request.userId!, params.id)
      return { ok: true }
    } catch (error) {
      const handled = handleAuthError(error)
      return reply.code(handled.statusCode).send({ error: handled.message })
    }
  })
}
