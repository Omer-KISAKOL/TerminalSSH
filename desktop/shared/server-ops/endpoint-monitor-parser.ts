import { extractOpsSection } from './section'

export type EndpointCheckStatus = 'ok' | 'degraded' | 'down' | 'unknown'

export interface EndpointProbeResult {
  url: string
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

export function parseEndpointMonitorOutput(
  host: string,
  raw: string,
  warnings: string[] = [],
): EndpointMonitorSnapshot {
  const probes: EndpointProbeResult[] = []

  for (const line of extractOpsSection(raw, 'PROBE_RESULTS').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const parts = trimmed.split('|')
    if (parts.length < 4) {
      continue
    }

    const httpStatus = parts[0] === '-' ? null : Number(parts[0])
    const responseMs = parts[1] === '-' ? null : Number(parts[1]) * 1000
    const sslToken = parts[2]
    const url = parts.slice(3).join('|')

    probes.push({
      url,
      httpStatus: Number.isFinite(httpStatus) ? httpStatus : null,
      responseMs: Number.isFinite(responseMs) ? responseMs : null,
      sslOk: sslToken === '1' ? true : sslToken === '0' ? false : null,
      status: statusFrom(
        Number.isFinite(httpStatus) ? httpStatus : null,
        Number.isFinite(responseMs) ? responseMs : null,
      ),
      detail: null,
    })
  }

  if (probes.length === 0) {
    warnings.push('Endpoint yanıtı alınamadı; curl veya yerel dinleyici erişimi yok.')
  }

  return {
    collectedAt: new Date().toISOString(),
    host,
    probes,
    warnings: [...warnings],
  }
}

export function endpointMonitorHasPayload(snapshot: EndpointMonitorSnapshot): boolean {
  return snapshot.probes.length > 0
}