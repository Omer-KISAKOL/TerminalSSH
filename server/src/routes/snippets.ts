import type { FastifyInstance } from 'fastify'

import { handleAuthError, requireAuth } from '../middleware/auth.js'
import {
  createSnippet,
  deleteSnippet,
  listSnippets,
  updateSnippet,
} from '../services/snippet-service.js'
import { snippetInputSchema } from '../validation.js'

export async function registerSnippetRoutes(app: FastifyInstance) {
  app.get('/profiles/:profileId/snippets', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const params = request.params as { profileId: string }
      const snippets = await listSnippets(request.userId!, params.profileId)
      return { snippets }
    } catch (error) {
      const handled = handleAuthError(error)
      return reply.code(handled.statusCode).send({ error: handled.message })
    }
  })

  app.post('/profiles/:profileId/snippets', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const params = request.params as { profileId: string }
      const body = snippetInputSchema.parse(request.body)
      const snippet = await createSnippet(request.userId!, params.profileId, body)
      return reply.code(201).send({ snippet })
    } catch (error) {
      const handled = handleAuthError(error)
      return reply.code(handled.statusCode).send({ error: handled.message })
    }
  })

  app.put(
    '/profiles/:profileId/snippets/:snippetId',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const params = request.params as { profileId: string; snippetId: string }
        const body = snippetInputSchema.partial().parse(request.body)
        const snippet = await updateSnippet(request.userId!, params.profileId, params.snippetId, body)
        return { snippet }
      } catch (error) {
        const handled = handleAuthError(error)
        return reply.code(handled.statusCode).send({ error: handled.message })
      }
    },
  )

  app.delete(
    '/profiles/:profileId/snippets/:snippetId',
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const params = request.params as { profileId: string; snippetId: string }
        await deleteSnippet(request.userId!, params.profileId, params.snippetId)
        return { ok: true }
      } catch (error) {
        const handled = handleAuthError(error)
        return reply.code(handled.statusCode).send({ error: handled.message })
      }
    },
  )
}
