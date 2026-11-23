import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildReleaseAssetUrl,
  readElectronFeed,
  type DesktopElectronPlatform,
} from './release-electron-yml.js'
import type { ReleasesManifest } from './release-service.js'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const defaultReleasesDir = path.join(serverRoot, 'data', 'releases')
const defaultManifestPath = path.join(serverRoot, 'data', 'releases.json')
const repoRoot = path.resolve(serverRoot, '..')

const DESKTOP_PLATFORMS: DesktopElectronPlatform[] = [
  'desktop-windows',
  'desktop-linux',
  'desktop-macos',
]

function readPubspecVersion(): string | null {
  const pubspecPath = path.join(repoRoot, 'mobile', 'pubspec.yaml')

  if (!existsSync(pubspecPath)) {
    return null
  }

  const raw = readFileSync(pubspecPath, 'utf8')
  const match = raw.match(/^version:\s*([^\s#]+)/m)

  if (!match?.[1]) {
    return null
  }

  return match[1].split('+')[0]?.trim() || null
}

function readExistingManifest(manifestPath: string): ReleasesManifest {
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf8')) as ReleasesManifest
  } catch {
    return {}
  }
}

export type SyncReleasesManifestOptions = {
  manifestPath?: string
  releasesDataDir?: string
  publicReleaseBaseUrl: string
}

export type SyncReleasesManifestResult = {
  manifestPath: string
  manifest: ReleasesManifest
  changed: boolean
}

export function syncReleasesManifest(options: SyncReleasesManifestOptions): SyncReleasesManifestResult {
  const manifestPath = options.manifestPath ?? defaultManifestPath
  const releasesDataDir = options.releasesDataDir ?? defaultReleasesDir
  const publicBaseUrl = options.publicReleaseBaseUrl.replace(/\/$/, '')
  const electronDir = path.join(releasesDataDir, 'electron')
  const previous = readExistingManifest(manifestPath)

  const manifest: ReleasesManifest = { ...previous }

  for (const platform of DESKTOP_PLATFORMS) {
    const feed = readElectronFeed(platform, electronDir)
    const entry = manifest[platform] ?? {
      version: '0.0.0',
      downloadUrl: '',
      releaseNotes: '',
    }

    if (feed) {
      manifest[platform] = {
        version: feed.version,
        downloadUrl: buildReleaseAssetUrl(publicBaseUrl, feed.fileName),
        releaseNotes: entry.releaseNotes ?? '',
      }
    }
  }

  const androidVersion = readPubspecVersion()
  const androidEntry = manifest.android ?? {
    version: '0.0.0',
    downloadUrl: `${publicBaseUrl}/releases/android/terminalssh.apk`,
    releaseNotes: '',
  }

  if (androidVersion) {
    manifest.android = {
      ...androidEntry,
      version: androidVersion,
      downloadUrl: androidEntry.downloadUrl?.trim()
        ? androidEntry.downloadUrl
        : `${publicBaseUrl}/releases/android/terminalssh.apk`,
    }
  }

  const serialized = `${JSON.stringify(manifest, null, 4)}\n`
  const previousSerialized = existsSync(manifestPath)
    ? readFileSync(manifestPath, 'utf8')
    : ''

  const changed = serialized !== previousSerialized

  if (changed) {
    writeFileSync(manifestPath, serialized, 'utf8')
  }

  return { manifestPath, manifest, changed }
}