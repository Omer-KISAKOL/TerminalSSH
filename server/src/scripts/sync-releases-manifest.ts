import { config as loadEnv } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { syncReleasesManifest } from '../services/release-manifest-sync.js'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
loadEnv({ path: path.join(serverRoot, '.env') })

const defaultBase = 'http://188.34.155.223:8787'
const publicBase = process.argv[2]?.trim() || process.env.PUBLIC_RELEASE_BASE_URL?.trim() || defaultBase

const { manifestPath, changed, manifest } = syncReleasesManifest({ publicReleaseBaseUrl: publicBase })

for (const platform of Object.keys(manifest) as Array<keyof typeof manifest>) {
  const entry = manifest[platform]

  if (!entry) {
    continue
  }

  console.log(`${platform}: ${entry.version}`)
}

console.log(changed ? `Güncellendi: ${manifestPath}` : `Değişiklik yok: ${manifestPath}`)