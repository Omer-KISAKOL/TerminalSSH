import { extractOpsSection } from './section'

export type EndpointCheckStatus = 'ok' | 'degraded' | 'down' | 'unknown' | 'listening'

export type EndpointProbeKind = 'http' | 'listener'

export interface EndpointProbeResult {
  url: string
  kind: EndpointProbeKind
  label: string | null
  httpStatus: number | null
  responseMs: number | null
  sslOk: boolean | null
  status: EndpointCheckStatus
  detail: string | null
}

export interface EndpointMonitorSnapshot {
  collectedAt: string
  host: string
  probes: EndpointProbeResult[]
  warnings: string[]
}

const WELL_KNOWN_PORT_LABELS: Record<number, string> = {
  22: 'SSH',
  53: 'DNS',
  80: 'HTTP',
  443: 'HTTPS',
  3005: 'Uygulama',
  3306: 'MySQL',
  33060: 'MySQL X',
  6379: 'Redis',
  8080: 'HTTP alt',
  8090: 'HTTP alt',
  8787: 'API',
}

const NON_HTTP_PORTS = new Set([22, 53, 3306, 33060, 6379, 5432, 27017])

export function labelForListenerPort(port: number): string {
  return WELL_KNOWN_PORT_LABELS[port] ?? `TCP :${port}`
}

export function isLikelyHttpProbePort(port: number): boolean {
  if (NON_HTTP_PORTS.has(port)) {
    return false
  }

  if (port === 80 || port === 443 || port === 8080 || port === 8443) {
    return true
  }

  return port >= 1024 && port <= 65535
}

export function portFromProbeUrl(url: string): number | null {
  const httpMatch = url.match(/^https?:\/\/127\.0\.0\.1:(\d+)/)
  if (httpMatch) {
    return Number(httpMatch[1])
  }

  const tcpMatch = url.match(/^tcp:\/\/127\.0\.0\.1:(\d+)/)
  if (tcpMatch) {
    return Number(tcpMatch[1])
  }

  if (/^https?:\/\/127\.0\.0\.1(?:\/|$)/.test(url)) {
    return url.startsWith('https') ? 443 : 80
  }

  return null
}

function statusFrom(httpStatus: number | null, responseMs: number | null): EndpointCheckStatus {
  if (httpStatus == null) {
    return 'unknown'
  }

  if (httpStatus >= 500 || httpStatus === 0) {
    return 'down'
  }

  if (httpStatus >= 400 || (responseMs != null && responseMs > 2500)) {
    return 'degraded'
  }

  return 'ok'
}

function parseProbeLine(line: string): EndpointProbeResult | null {
  const trimmed = line.replace(/\r$/, '').trim()
  if (!trimmed || trimmed.startsWith('===')) {
    return null
  }

  const parts = trimmed.split('|')
  if (parts.length < 4) {
    return null
  }

  const statusToken = parts[0]
  const timeToken = parts[1]
  const sslToken = parts[2]
  const url = parts.slice(3).join('|')

  const httpStatus =
    statusToken === '-' || statusToken === '' ? null : Number(statusToken)
  const responseMs =
    timeToken === '-' || timeToken === '' ? null : Number(timeToken) * 1000
  const sslOk = sslToken === '1' ? true : sslToken === '0' ? false : null

  const finiteStatus = Number.isFinite(httpStatus) ? httpStatus : null
  const finiteMs = Number.isFinite(responseMs) ? responseMs : null
  const port = portFromProbeUrl(url)

  return {
    url,
    kind: 'http',
    label: port != null ? labelForListenerPort(port) : null,
    httpStatus: finiteStatus,
    responseMs: finiteMs,
    sslOk,
    status: statusFrom(finiteStatus, finiteMs),
    detail:
      finiteStatus === 0 || finiteStatus === null
        ? 'HTTP yanıtı alınamadı'
        : null,
  }
}

function parseListenerLines(sectionText: string): EndpointProbeResult[] {
  const probes: EndpointProbeResult[] = []
  const seen = new Set<string>()

  for (const line of sectionText.split('\n')) {
    const trimmed = line.replace(/\r$/, '').trim()
    if (!trimmed || /^state/i.test(trimmed)) {
      continue
    }

    const portMatch = trimmed.match(/:(\d+)(?:\s|$)/)
    if (!portMatch) {
      continue
    }

    const port = Number(portMatch[1])
    if (!Number.isFinite(port)) {
      continue
    }

    const url = `tcp://127.0.0.1:${port}`
    if (seen.has(url)) {
      continue
    }

    seen.add(url)
    probes.push({
      url,
      kind: 'listener',
      label: labelForListenerPort(port),
      httpStatus: null,
      responseMs: null,
      sslOk: null,
      status: 'listening',
      detail: null,
    })
  }

  return probes
}

function dedupeProbes(probes: EndpointProbeResult[]): EndpointProbeResult[] {
  const httpPorts = new Set(
    probes
      .filter((probe) => probe.kind === 'http')
      .map((probe) => portFromProbeUrl(probe.url))
      .filter((port): port is number => port != null),
  )

  const httpUrls = new Set(probes.filter((probe) => probe.kind === 'http').map((probe) => probe.url))
  const ordered: EndpointProbeResult[] = []

  for (const probe of probes) {
    if (probe.kind === 'http') {
      if (!httpUrls.has(probe.url)) {
        continue
      }
      httpUrls.delete(probe.url)
      ordered.push(probe)
      continue
    }

    const port = portFromProbeUrl(probe.url)
    if (port != null && httpPorts.has(port)) {
      continue
    }

    ordered.push(probe)
  }

  return ordered.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === 'http' ? -1 : 1
    }

    const portA = portFromProbeUrl(a.url) ?? 0
    const portB = portFromProbeUrl(b.url) ?? 0
    return portA - portB
  })
}

export function parseEndpointMonitorOutput(
  host: string,
  raw: string,
  extraWarnings: string[] = [],
): EndpointMonitorSnapshot {
  const warnings = [...extraWarnings]
  const probes: EndpointProbeResult[] = []
  const seenUrls = new Set<string>()

  const probeSection = extractOpsSection(raw, 'PROBE_RESULTS')
  const probeScan = probeSection || raw

  for (const line of probeScan.split('\n')) {
    const probe = parseProbeLine(line)
    if (!probe || seenUrls.has(probe.url)) {
      continue
    }

    seenUrls.add(probe.url)
    probes.push(probe)
  }

  for (const probe of parseListenerLines(extractOpsSection(raw, 'LISTENERS'))) {
    if (seenUrls.has(probe.url)) {
      continue
    }

    seenUrls.add(probe.url)
    probes.push(probe)
  }

  return {
    collectedAt: new Date().toISOString(),
    host,
    probes: dedupeProbes(probes),
    warnings,
  }
}

export function endpointMonitorHasPayload(snapshot: EndpointMonitorSnapshot): boolean {
  return snapshot.probes.length > 0
}

export function httpProbePortsForSnapshot(snapshot: EndpointMonitorSnapshot): number[] {
  const fromListeners = snapshot.probes
    .filter((probe) => probe.kind === 'listener')
    .map((probe) => portFromProbeUrl(probe.url))
    .filter((port): port is number => port != null && isLikelyHttpProbePort(port))

  const defaults = [80, 443, 3005, 8090, 8787, 8080, 3000]
  return [...new Set([...defaults, ...fromListeners])].slice(0, 10)
}