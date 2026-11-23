import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const APP_RELEASE_PLATFORMS = [
  'desktop-windows',
  'desktop-linux',
  'desktop-macos',
  'android',
] as const

export type AppReleasePlatform = (typeof APP_RELEASE_PLATFORMS)[number]

export type PlatformRelease = {
  version: string
  downloadUrl: string
  releaseNotes?: string
}

export type ReleasesManifest = Partial<Record<AppReleasePlatform, PlatformRelease>>

export type ReleaseCheckResult = {
  updateAvailable: boolean
  currentVersion: string
  latestVersion: string | null
  downloadUrl: string | null
  releaseNotes: string | null
}

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const defaultManifestPath = path.join(serverRoot, 'data', 'releases.json')

let cachedManifest: ReleasesManifest | null = null
let cachedManifestMtimeMs = 0

function loadManifest(manifestPath = defaultManifestPath): ReleasesManifest {
  try {
    const { mtimeMs } = statSync(manifestPath)
    if (cachedManifest && cachedManifestMtimeMs === mtimeMs) {
      return cachedManifest
    }

    const raw = readFileSync(manifestPath, 'utf8')
    const parsed = JSON.parse(raw) as ReleasesManifest
    cachedManifest = parsed
    cachedManifestMtimeMs = mtimeMs
    return parsed
  } catch {
    return {}
  }
}

export function compareSemver(left: string, right: string): number {
  const parse = (value: string) =>
    value
      .trim()
      .split(/[.+]/)
      .map((part) => parseInt(part.replace(/[^\d]/g, ''), 10) || 0)

  const leftParts = parse(left)
  const rightParts = parse(right)
  const length = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < length; index += 1) {
    const a = leftParts[index] ?? 0
    const b = rightParts[index] ?? 0

    if (a > b) {
      return 1
    }

    if (a < b) {
      return -1
    }
  }

  return 0
}

export function isAppReleasePlatform(value: string): value is AppReleasePlatform {
  return (APP_RELEASE_PLATFORMS as readonly string[]).includes(value)
}

export function checkRelease(
  platform: AppReleasePlatform,
  currentVersion: string,
  manifestPath?: string,
): ReleaseCheckResult {
  const manifest = loadManifest(manifestPath)
  const entry = manifest[platform]

  if (!entry?.version) {
    return {
      updateAvailable: false,
      currentVersion,
      latestVersion: null,
      downloadUrl: null,
      releaseNotes: null,
    }
  }

  const updateAvailable = compareSemver(entry.version, currentVersion) > 0

  return {
    updateAvailable,
    currentVersion,
    latestVersion: entry.version,
    downloadUrl: updateAvailable ? entry.downloadUrl : null,
    releaseNotes: entry.releaseNotes?.trim() || null,
  }
}