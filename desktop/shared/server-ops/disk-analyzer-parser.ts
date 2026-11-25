import { extractOpsSection } from './section'

export type DiskUsageKind = 'directory' | 'file' | 'log' | 'cache'

export interface DiskUsageItem {
  path: string
  bytes: number
  kind: DiskUsageKind
}

export interface DiskMountRow {
  filesystem: string
  size: string
  used: string
  available: string
  usePercent: string
  mountpoint: string
}

export interface DiskSpaceAnalyzerSnapshot {
  collectedAt: string
  host: string
  mounts: DiskMountRow[]
  topDirectories: DiskUsageItem[]
  largeFiles: DiskUsageItem[]
  clutterItems: DiskUsageItem[]
  warnings: string[]
}

function parseMountSection(sectionText: string): DiskMountRow[] {
  const lines = sectionText.split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length < 2) {
    return []
  }

  return lines.slice(1).flatMap((line) => {
    const parts = line.split(/\s+/)
    if (parts.length < 6) {
      return []
    }

    return [
      {
        filesystem: parts[0],
        size: parts[1],
        used: parts[2],
        available: parts[3],
        usePercent: parts[4],
        mountpoint: parts.slice(5).join(' '),
      },
    ]
  })
}

function classifyPath(path: string): DiskUsageKind {
  const lower = path.toLowerCase()
  if (lower.includes('/var/log') || lower.endsWith('.log')) {
    return 'log'
  }
  if (lower.includes('/var/cache') || lower.includes('/cache/') || lower.includes('/.cache')) {
    return 'cache'
  }
  return 'file'
}

function parseDuLines(sectionText: string, kind: DiskUsageKind = 'directory'): DiskUsageItem[] {
  const items: DiskUsageItem[] = []

  for (const line of sectionText.split('\n')) {
    const trimmed = line.trim()
    const match = trimmed.match(/^(\d+)\s+(.+)$/)
    if (!match) {
      continue
    }

    const bytes = Number(match[1])
    const path = match[2].trim()
    if (!Number.isFinite(bytes) || !path) {
      continue
    }

    items.push({ path, bytes, kind })
  }

  return items.sort((a, b) => b.bytes - a.bytes).slice(0, 20)
}

function parseSizePathLines(sectionText: string): DiskUsageItem[] {
  const items: DiskUsageItem[] = []

  for (const line of sectionText.split('\n')) {
    const trimmed = line.trim()
    const pipeMatch = trimmed.match(/^(\d+)\|(.+)\|(log|cache|file)$/)
    if (!pipeMatch) {
      const duMatch = trimmed.match(/^(\d+)\s+(.+)$/)
      if (duMatch) {
        const path = duMatch[2]
        items.push({
          path,
          bytes: Number(duMatch[1]),
          kind: classifyPath(path),
        })
      }
      continue
    }

    const bytes = Number(pipeMatch[1])
    const path = pipeMatch[2]
    const tag = pipeMatch[3]
    const kind: DiskUsageKind = tag === 'log' || tag === 'cache' ? tag : classifyPath(path)

    if (Number.isFinite(bytes) && path) {
      items.push({ path, bytes, kind })
    }
  }

  return items.sort((a, b) => b.bytes - a.bytes).slice(0, 25)
}

export function diskAnalyzerHasPayload(snapshot: DiskSpaceAnalyzerSnapshot): boolean {
  return (
    snapshot.topDirectories.length > 0 ||
    snapshot.largeFiles.length > 0 ||
    snapshot.clutterItems.length > 0
  )
}

export function parseDiskAnalyzerOutput(
  host: string,
  raw: string,
  warnings: string[] = [],
): DiskSpaceAnalyzerSnapshot {
  const mounts = parseMountSection(extractOpsSection(raw, 'MOUNTS'))
  const topDirectories = parseDuLines(extractOpsSection(raw, 'TOP_DIRS'))
  const largeFiles = parseSizePathLines(extractOpsSection(raw, 'LARGE_FILES')).map((item) => ({
    ...item,
    kind: 'file' as const,
  }))
  const clutterItems = parseSizePathLines(extractOpsSection(raw, 'CLUTTER'))

  if (!diskAnalyzerHasPayload({ collectedAt: '', host, mounts, topDirectories, largeFiles, clutterItems, warnings })) {
    warnings.push('Disk analizi boş; du/find komutları veya yetkiler yetersiz olabilir.')
  }

  return {
    collectedAt: new Date().toISOString(),
    host,
    mounts,
    topDirectories,
    largeFiles,
    clutterItems,
    warnings: [...warnings],
  }
}