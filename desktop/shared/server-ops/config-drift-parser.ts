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

const FINGERPRINT_LINE =
  /^(?:MISSING|DENIED|[a-fA-F0-9]{32,64})\|[^|]+(?:\|\d+)?$/

export function extractConfigFingerprintLines(output: string): string[] {
  const lines: string[] = []
  for (const line of output.split('\n')) {
    const trimmed = line.replace(/\r$/, '').trim()
    if (FINGERPRINT_LINE.test(trimmed)) {
      lines.push(trimmed)
    }
  }
  return lines
}

function parseFingerprintLine(line: string): ConfigFingerprint | null {
  const trimmed = line.replace(/\r$/, '').trim()
  if (!trimmed || !FINGERPRINT_LINE.test(trimmed)) {
    return null
  }

  const parts = trimmed.split('|').map((part) => part.trim())
  if (parts.length < 2) {
    return null
  }

  const token = parts[0].toUpperCase()
  const sha256 =
    token === 'MISSING' || token === 'DENIED' ? null : parts[0].toLowerCase()
  const path = parts[1]
  const size = parts[2] ? Number(parts[2]) : null

  return {
    path,
    kind: inferKind(path),
    sha256,
    sizeBytes: Number.isFinite(size) ? size : null,
    readable: sha256 !== null,
  }
}

export function parseConfigFingerprints(raw: string): ConfigFingerprint[] {
  const section = extractOpsSection(raw, 'CONFIG_HASH')
  const scanText = section || raw
  const items: ConfigFingerprint[] = []
  const seen = new Set<string>()

  for (const line of scanText.split('\n')) {
    const fp = parseFingerprintLine(line)
    if (!fp || seen.has(fp.path)) {
      continue
    }

    seen.add(fp.path)
    items.push(fp)
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