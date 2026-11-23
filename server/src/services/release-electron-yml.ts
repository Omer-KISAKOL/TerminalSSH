import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export type DesktopElectronPlatform = 'desktop-windows' | 'desktop-linux' | 'desktop-macos'

export type ElectronBuilderFeed = {
  version: string
  fileName: string
}

const FEED_FILE_BY_PLATFORM: Record<DesktopElectronPlatform, string> = {
  'desktop-windows': 'latest.yml',
  'desktop-macos': 'latest-mac.yml',
  'desktop-linux': 'latest-linux.yml',
}

export function electronFeedFileName(platform: DesktopElectronPlatform): string | null {
  return FEED_FILE_BY_PLATFORM[platform] ?? null
}

export function parseElectronBuilderFeedYaml(raw: string): ElectronBuilderFeed | null {
  const versionMatch = raw.match(/^version:\s*['"]?([^\s'"]+)['"]?\s*$/m)
  const pathMatch = raw.match(/^path:\s*(.+)\s*$/m)
  const version = versionMatch?.[1]?.trim()

  if (!version) {
    return null
  }

  let fileName = pathMatch?.[1]?.trim() ?? ''

  if (!fileName) {
    const filesBlock = raw.match(/^\s+-\s+url:\s*(.+)\s*$/m)
    fileName = filesBlock?.[1]?.trim() ?? ''
  }

  fileName = fileName.replace(/^['"]|['"]$/g, '')

  if (!fileName) {
    return null
  }

  return { version, fileName }
}

export function isDesktopElectronPlatform(value: string): value is DesktopElectronPlatform {
  return value in FEED_FILE_BY_PLATFORM
}

export function readElectronFeed(
  platform: DesktopElectronPlatform,
  electronDir: string,
): ElectronBuilderFeed | null {
  const feedName = electronFeedFileName(platform)

  if (!feedName) {
    return null
  }

  const feedPath = path.join(electronDir, feedName)

  if (!existsSync(feedPath)) {
    return null
  }

  const raw = readFileSync(feedPath, 'utf8')
  return parseElectronBuilderFeedYaml(raw)
}

export function buildReleaseAssetUrl(publicBaseUrl: string, fileName: string): string {
  const base = publicBaseUrl.replace(/\/$/, '')
  return `${base}/releases/electron/${encodeURIComponent(fileName)}`
}