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
  app.get('/snippets', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const snippets = await listSnippets(request.userId!)
      return { snippets }
    } catch (error) {
      const handled = handleAuthError(error)
      return reply.code(handled.statusCode).send({ error: handled.message })
    }
  })

  app.post('/snippets', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const body = snippetInputSchema.parse(request.body)
      const snippet = await createSnippet(request.userId!, body)
      return reply.code(201).send({ snippet })
    } catch (error) {
      const handled = handleAuthError(error)
      return reply.code(handled.statusCode).send({ error: handled.message })
    }
  })

  app.put('/snippets/:snippetId', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const params = request.params as { snippetId: string }
      const body = snippetInputSchema.partial().parse(request.body)
      const snippet = await updateSnippet(request.userId!, params.snippetId, body)
      return { snippet }
    } catch (error) {
      const handled = handleAuthError(error)
      return reply.code(handled.statusCode).send({ error: handled.message })
    }
  })

  app.delete('/snippets/:snippetId', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const params = request.params as { snippetId: string }
      await deleteSnippet(request.userId!, params.snippetId)
      return { ok: true }
    } catch (error) {
      const handled = handleAuthError(error)
      return reply.code(handled.statusCode).send({ error: handled.message })
    }
  })
}
