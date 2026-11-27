import type {
  CollectEndpointMonitorResponse,
  CollectIncidentAnalyzerResponse,
} from '@shared/contracts/server-ops'
import {
  endpointMonitorHasPayload,
  httpProbePortsForSnapshot,
  parseEndpointMonitorOutput,
} from '@shared/server-ops/endpoint-monitor-parser'
import { buildIncidentAnalyzerSnapshot, incidentAnalyzerHasPayload } from '@shared/server-ops/incident-analyzer-parser'

import {
  buildEndpointListenersCommand,
  buildEndpointMonitorCommand,
  buildEndpointProbeCommand,
  ENDPOINT_PROBE_URLS,
} from './endpoint-monitor-collector'
import { buildIncidentAnalyzerCommand } from './incident-analyzer-collector'
import { operationalTimelineStore } from './operational-timeline-store'
import { setCachedEndpoints, setCachedIncident } from './server-intelligence-cache'
import { sshSessionManager } from './ssh-session-manager'

async function execCollect(
  webContentsId: number,
  sessionId: string,
  command: string,
  timeoutMs: number,
): Promise<string> {
  const result = await sshSessionManager.exec(webContentsId, sessionId, command, timeoutMs)
  return `${result.stdout}\n${result.stderr}`.trim()
}

async function execRemoteLine(
  webContentsId: number,
  sessionId: string,
  command: string,
): Promise<string> {
  try {
    const result = await sshSessionManager.exec(webContentsId, sessionId, command, 12_000)
    return `${result.stdout}\n${result.stderr}`.trim()
  } catch {
    return ''
  }
}

export const serverOpsExtendedService = {
  async collectEndpointMonitor(
    webContentsId: number,
    sessionId: string,
  ): Promise<CollectEndpointMonitorResponse> {
    const meta = sshSessionManager.getSessionMeta(webContentsId, sessionId)
    if (!meta) {
      throw new Error('SSH oturumu bulunamadı.')
    }

    const warnings: string[] = []
    let raw = ''

    try {
      raw = await execCollect(webContentsId, sessionId, buildEndpointMonitorCommand(), 30_000)
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'Endpoint taraması başarısız.')
    }

    let snapshot = parseEndpointMonitorOutput(meta.host, raw, warnings)

    const needsListenerFallback = !endpointMonitorHasPayload(snapshot)
    const needsHttpAugment = !snapshot.probes.some((probe) => probe.kind === 'http')

    if (needsListenerFallback || needsHttpAugment) {
      if (needsListenerFallback) {
        const listeners = await execRemoteLine(
          webContentsId,
          sessionId,
          buildEndpointListenersCommand(),
        )
        raw = `${raw}\n===LISTENERS===\n${listeners}`
        snapshot = parseEndpointMonitorOutput(meta.host, raw, warnings)
      }

      const probeLines: string[] = []
      const ports = httpProbePortsForSnapshot(snapshot)
      for (const port of ports) {
        const urls =
          port === 443
            ? [`https://127.0.0.1:${port}/`]
            : [`http://127.0.0.1:${port}/`, ...(port === 80 ? ['http://127.0.0.1/'] : [])]
        for (const url of urls) {
          const line = await execRemoteLine(
            webContentsId,
            sessionId,
            buildEndpointProbeCommand(url),
          )
          const trimmed = line.trim().split('\n').pop()?.trim()
          if (trimmed) {
            probeLines.push(trimmed)
          }
        }
      }

      if (probeLines.length === 0) {
        for (const url of ENDPOINT_PROBE_URLS.slice(0, 6)) {
          const line = await execRemoteLine(webContentsId, sessionId, buildEndpointProbeCommand(url))
          const trimmed = line.trim().split('\n').pop()?.trim()
          if (trimmed) {
            probeLines.push(trimmed)
          }
        }
      }

      if (probeLines.length > 0) {
        raw = `${raw}\n===PROBE_RESULTS===\n${probeLines.join('\n')}`
        snapshot = parseEndpointMonitorOutput(meta.host, raw, warnings)
      }
    }

    if (!endpointMonitorHasPayload(snapshot)) {
      snapshot = {
        ...snapshot,
        warnings: [
          ...snapshot.warnings,
          'HTTP yanıtı veya dinleyici listesi alınamadı. Sunucuda curl/ss kurulu ve 127.0.0.1 erişimi açık olmalı.',
        ],
      }
    }

    setCachedEndpoints(sessionId, snapshot)
    return { snapshot }
  },

  async collectIncidentAnalyzer(
    webContentsId: number,
    sessionId: string,
  ): Promise<CollectIncidentAnalyzerResponse> {
    const meta = sshSessionManager.getSessionMeta(webContentsId, sessionId)
    if (!meta) {
      throw new Error('SSH oturumu bulunamadı.')
    }

    const warnings: string[] = []
    let raw = ''

    try {
      raw = await execCollect(webContentsId, sessionId, buildIncidentAnalyzerCommand(), 20_000)
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'Olay analizi başarısız.')
    }

    const cutoff = Date.now() - 3 * 60 * 60 * 1000
    const timelineSummaries = operationalTimelineStore
      .list(meta.serverKey, 120)
      .filter((event) => new Date(event.createdAt).getTime() >= cutoff)
      .map((event) => ({
        summary: event.summary,
        detail: event.detail,
        createdAt: event.createdAt,
        type: event.type,
      }))

    let snapshot = buildIncidentAnalyzerSnapshot({
      host: meta.host,
      raw,
      timelineSummaries,
      warnings,
    })

    if (!incidentAnalyzerHasPayload(snapshot)) {
      warnings.push('Olay sinyali bulunamadı; zaman aralığını genişletmeyi deneyin.')
      snapshot = { ...snapshot, warnings: [...snapshot.warnings, ...warnings] }
    }

    setCachedIncident(sessionId, snapshot)
    return { snapshot }
  },
}