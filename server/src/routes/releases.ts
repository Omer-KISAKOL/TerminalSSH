import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { FastifyInstance } from 'fastify'

import {
  isDesktopElectronPlatform,
  readElectronFeed,
} from '../services/release-electron-yml.js'
import {
  APP_RELEASE_PLATFORMS,
  checkRelease,
  isAppReleasePlatform,
} from '../services/release-service.js'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const electronReleaseDir = path.join(serverRoot, 'data', 'releases', 'electron')

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

  app.get('/releases/installer', async (request, reply) => {
    const query = request.query as { platform?: string }
    const platform = query.platform?.trim() ?? ''

    if (!isAppReleasePlatform(platform)) {
      return reply.code(400).send({
        error: 'invalid_platform',
        message: `platform must be one of: ${APP_RELEASE_PLATFORMS.join(', ')}`,
      })
    }

    if (platform === 'android') {
      return reply.redirect('/releases/android/terminalssh.apk')
    }

    if (!isDesktopElectronPlatform(platform)) {
      return reply.code(400).send({ error: 'invalid_platform' })
    }

    const feed = readElectronFeed(platform, electronReleaseDir)

    if (!feed) {
      return reply.code(404).send({ error: 'installer_not_found' })
    }

    const encoded = encodeURIComponent(feed.fileName)
    return reply.redirect(`/releases/electron/${encoded}`)
  })
}