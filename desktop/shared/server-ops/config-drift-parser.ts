import { extractOpsSection } from './section'

export type DriftConfigKind = 'nginx' | 'ssh' | 'firewall' | 'other'

export interface ConfigFingerprint {
  path: string
  kind: DriftConfigKind
  sha256: string | null
  sizeBytes: number | null
  readable: boolean
}

export interface ConfigDriftChange {
  path: string
  kind: DriftConfigKind
  previousSha256: string | null
  currentSha256: string | null
  status: 'added' | 'removed' | 'changed' | 'unchanged'
}

export interface ConfigDriftSnapshot {
  collectedAt: string
  host: string
  baselineCapturedAt: string | null
  isInitialBaseline: boolean
  fingerprints: ConfigFingerprint[]
  changes: ConfigDriftChange[]
  warnings: string[]
}

function inferKind(path: string): DriftConfigKind {
  const lower = path.toLowerCase()
  if (lower.includes('nginx')) {
    return 'nginx'
  }
  if (lower.includes('ssh')) {
    return 'ssh'
  }
  if (lower.includes('ufw') || lower.includes('iptables') || lower.includes('firewalld')) {
    return 'firewall'
  }
  return 'other'
}

export function parseConfigFingerprints(raw: string): ConfigFingerprint[] {
  const section = extractOpsSection(raw, 'CONFIG_HASH')
  const items: ConfigFingerprint[] = []

  for (const line of section.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const parts = trimmed.split('|')
    if (parts.length < 2) {
      continue
    }

    const sha256 = parts[0] === 'MISSING' ? null : parts[0]
    const path = parts[1]
    const size = parts[2] ? Number(parts[2]) : null

    items.push({
      path,
      kind: inferKind(path),
      sha256,
      sizeBytes: Number.isFinite(size) ? size : null,
      readable: sha256 !== null,
    })
  }

  return items
}

export function compareConfigDrift(
  host: string,
  current: ConfigFingerprint[],
  baseline: Array<{ path: string; sha256: string | null; capturedAt: string }> | null,
  warnings: string[] = [],
): ConfigDriftSnapshot {
  const baselineCapturedAt = baseline?.[0] ? baseline[0].capturedAt : null
  const baselineMap = new Map(
    (baseline ?? []).map((entry) => [entry.path, entry.sha256] as const),
  )
  const isInitialBaseline = baseline == null || baseline.length === 0

  const changes: ConfigDriftChange[] = []

  for (const fp of current) {
    const previous = baselineMap.get(fp.path)
    if (previous === undefined) {
      changes.push({
        path: fp.path,
        kind: fp.kind,
        previousSha256: null,
        currentSha256: fp.sha256,
        status: isInitialBaseline ? 'unchanged' : 'added',
      })
      continue
    }

    const status =
      previous === fp.sha256 ? 'unchanged' : fp.sha256 == null ? 'removed' : 'changed'

    changes.push({
      path: fp.path,
      kind: fp.kind,
      previousSha256: previous,
      currentSha256: fp.sha256,
      status,
    })
    baselineMap.delete(fp.path)
  }

  for (const [path, previousSha256] of baselineMap) {
    changes.push({
      path,
      kind: inferKind(path),
      previousSha256,
      currentSha256: null,
      status: 'removed',
    })
  }

  return {
    collectedAt: new Date().toISOString(),
    host,
    baselineCapturedAt,
    isInitialBaseline,
    fingerprints: current,
    changes,
    warnings: [...warnings],
  }
}

export function configDriftHasPayload(snapshot: ConfigDriftSnapshot): boolean {
  return snapshot.fingerprints.length > 0
}