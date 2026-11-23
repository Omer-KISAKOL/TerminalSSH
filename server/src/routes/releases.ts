import type { FastifyInstance } from 'fastify'

import {
  APP_RELEASE_PLATFORMS,
  checkRelease,
  isAppReleasePlatform,
} from '../services/release-service.js'

export async function registerReleaseRoutes(app: FastifyInstance): Promise<void> {
  app.get('/releases/check', async (request, reply) => {
    const query = request.query as { platform?: string; current?: string }

    const platform = query.platform?.trim() ?? ''
    const current = query.current?.trim() ?? ''

    if (!isAppReleasePlatform(platform)) {
      return reply.code(400).send({
        error: 'invalid_platform',
        message: `platform must be one of: ${APP_RELEASE_PLATFORMS.join(', ')}`,
      })
    }

    if (!current) {
      return reply.code(400).send({
        error: 'invalid_version',
        message: 'current version is required',
      })
    }

    return checkRelease(platform, current)
  })
}