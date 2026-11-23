import { createReadStream, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const releasesRoot = path.join(serverRoot, 'data', 'releases')

function isSafeFileName(fileName: string): boolean {
  return /^[A-Za-z0-9._-]+$/.test(fileName)
}

function sendAsset(
  request: FastifyRequest<{ Params: { file: string } }>,
  reply: FastifyReply,
  subdir: 'electron' | 'android',
) {
  const fileName = request.params.file

  if (!isSafeFileName(fileName)) {
    return reply.code(400).send({ error: 'invalid_file_name' })
  }

  const filePath = path.join(releasesRoot, subdir, fileName)

  if (!existsSync(filePath)) {
    return reply.code(404).send({ error: 'not_found' })
  }

  const stream = createReadStream(filePath)
  return reply.send(stream)
}

export async function registerReleaseAssetRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/releases/electron/:file',
    async (request: FastifyRequest<{ Params: { file: string } }>, reply) =>
      sendAsset(request, reply, 'electron'),
  )

  app.get(
    '/releases/android/:file',
    async (request: FastifyRequest<{ Params: { file: string } }>, reply) =>
      sendAsset(request, reply, 'android'),
  )
}