import cors from '@fastify/cors'
import Fastify from 'fastify'

import { config } from './config.js'
import { registerAuthRoutes } from './routes/auth.js'
import { registerProfileRoutes } from './routes/profiles.js'

export async function buildApp() {
  const app = Fastify({
    logger: config.nodeEnv !== 'production',
  })

  await app.register(cors, {
    origin:
      config.nodeEnv === 'production'
        ? config.corsOrigins
        : (origin, callback) => {
            if (
              !origin ||
              /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
              config.corsOrigins.includes(origin)
            ) {
              callback(null, true)
              return
            }

            callback(new Error('Not allowed by CORS'), false)
          },
    credentials: true,
  })

  app.get('/health', async () => ({ ok: true }))

  await registerAuthRoutes(app)
  await registerProfileRoutes(app)

  return app
}
