import type { ServerIntelligenceSnapshot, ServerDiskSnapshot, ServerMemorySnapshot } from '@shared/contracts/server-ops'
import { extractOpsSection } from '@shared/server-ops/section'

const INTELLIGENCE_SHELL = `
echo '===META==='
uname -a 2>/dev/null
hostname 2>/dev/null
echo '===UPTIME==='
uptime 2>/dev/null
echo '===MEM==='
free -b 2>/dev/null
echo '===DISK==='
df -h -P -x tmpfs -x devtmpfs 2>/dev/null | head -n 20
echo '===OS==='
cat /etc/os-release 2>/dev/null | head -n 12
echo '===SERVICES==='
systemctl list-units --type=service --state=running --no-pager --no-legend 2>/dev/null | awk '{print $1}' | head -n 25
echo '===TOOLS==='
for c in docker docker-compose nginx node npm pm2 python3 php mysql mariadb postgres psql redis-server git; do
  command -v "$c" >/dev/null 2>&1 && echo "$c"
done
`.trim()

export function buildIntelligenceCommand(): string {
  return `/bin/sh -c ${JSON.stringify(INTELLIGENCE_SHELL)}`
}

export function intelligenceHasPayload(snapshot: ServerIntelligenceSnapshot): boolean {
  return Boolean(
    snapshot.hostname ||
      snapshot.kernel ||
      snapshot.osName ||
      snapshot.uptime ||
      snapshot.memory ||
      snapshot.disks.length > 0 ||
      snapshot.detectedTools.length > 0 ||
      snapshot.runningServices.length > 0,
  )
}

function parseOsRelease(sectionText: string): { osName: string | null; osVersion: string | null } {
  let osName: string | null = null
  let osVersion: string | null = null

  for (const line of sectionText.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('PRETTY_NAME=')) {
      osName = trimmed.replace(/^PRETTY_NAME=/, '').replace(/^"|"$/g, '')
    }

    if (trimmed.startsWith('VERSION_ID=')) {
      osVersion = trimmed.replace(/^VERSION_ID=/, '').replace(/^"|"$/g, '')
    }
  }

  return { osName, osVersion }
}

function parseMemory(sectionText: string): ServerMemorySnapshot | null {
  const lines = sectionText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  let memLine =
    lines.find((line) => /^mem:/i.test(line) && /\d/.test(line)) ??
    lines.find((line) => /^mem:/i.test(line))

  if (!memLine) {
    return null
  }

  const parts = memLine.split(/\s+/)

  if (parts.length < 4) {
    return null
  }

  if (parts.length < 7) {
    const humanSummary =
      parts.length >= 4 && /[0-9]/.test(parts[1] + parts[2]) ? `${parts[2]} / ${parts[1]}` : null

    return {
      totalBytes: null,
      usedBytes: null,
      availableBytes: null,
      summary: humanSummary,
    }
  }

  const toNumber = (value: string) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return {
    totalBytes: toNumber(parts[1]),
    usedBytes: toNumber(parts[2]),
    availableBytes: toNumber(parts[6]),
  }
}

function parseDisks(sectionText: string): ServerDiskSnapshot[] {
  const lines = sectionText.split('\n').map((line) => line.trim()).filter(Boolean)

  if (lines.length < 2) {
    return []
  }

  return lines.slice(1).map((line) => {
    const parts = line.split(/\s+/)

    if (parts.length < 6) {
      return null
    }

    return {
      filesystem: parts[0],
      size: parts[1],
      used: parts[2],
      available: parts[3],
      usePercent: parts[4],
      mountpoint: parts.slice(5).join(' '),
    }
  }).filter((item): item is ServerDiskSnapshot => item !== null)
}

function parseUptime(sectionText: string): { uptime: string | null; loadAverage: string | null } {
  const line = sectionText.split('\n').map((item) => item.trim()).find(Boolean) ?? ''
  const loadMatch = line.match(/load average[s]?:\s*(.+)$/i)

  return {
    uptime: line || null,
    loadAverage: loadMatch?.[1]?.trim() ?? null,
  }
}

export function parseIntelligenceOutput(host: string, raw: string, warnings: string[] = []): ServerIntelligenceSnapshot {
  const meta = extractOpsSection(raw, 'META')
  const metaLines = meta.split('\n').map((line) => line.trim()).filter(Boolean)
  const kernel = metaLines[0] ?? null
  const hostname = metaLines[1] ?? null

  const uptimeSection = parseUptime(extractOpsSection(raw, 'UPTIME'))
  const memory = parseMemory(extractOpsSection(raw, 'MEM'))
  const disks = parseDisks(extractOpsSection(raw, 'DISK'))
  const os = parseOsRelease(extractOpsSection(raw, 'OS'))

  const runningServices = extractOpsSection(raw, 'SERVICES')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const detectedTools = extractOpsSection(raw, 'TOOLS')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const hasCoreMetrics =
    Boolean(hostname || kernel || uptimeSection.uptime || memory?.summary || memory?.totalBytes) ||
    disks.length > 0 ||
    detectedTools.length > 0 ||
    runningServices.length > 0

  if (!hasCoreMetrics) {
    warnings.push('Sistem çıktısı sınırlı; sunucu komutları kısıtlı olabilir.')
  }

  return {
    collectedAt: new Date().toISOString(),
    host,
    hostname,
    osName: os.osName,
    osVersion: os.osVersion,
    kernel,
    uptime: uptimeSection.uptime,
    loadAverage: uptimeSection.loadAverage,
    memory,
    disks,
    runningServices,
    detectedTools,
    warnings,
  }
}