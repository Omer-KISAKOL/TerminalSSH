import type {
  CollectConfigDriftResponse,
  CollectDiskSpaceResponse,
  CollectEndpointMonitorResponse,
  CollectEnvInspectorResponse,
  CollectIncidentAnalyzerResponse,
} from '@shared/contracts/server-ops'
import {
  compareConfigDrift,
  configDriftHasPayload,
  extractConfigFingerprintLines,
  parseConfigFingerprints,
} from '@shared/server-ops/config-drift-parser'
import {
  diskAnalyzerHasPayload,
  parseDiskAnalyzerOutput,
} from '@shared/server-ops/disk-analyzer-parser'
import {
  endpointMonitorHasPayload,
  httpProbePortsForSnapshot,
  parseEndpointMonitorOutput,
} from '@shared/server-ops/endpoint-monitor-parser'
import {
  envInspectorHasPayload,
  parseEnvFilePaths,
  parseEnvInspectorOutput,
} from '@shared/server-ops/env-inspector-parser'
import { buildIncidentAnalyzerSnapshot, incidentAnalyzerHasPayload } from '@shared/server-ops/incident-analyzer-parser'

import {
  buildConfigDriftCommand,
  buildConfigDriftDiscoverCommand,
  buildConfigDriftPathCommand,
  CONFIG_DRIFT_PATHS,
} from './config-drift-collector'
import { configDriftStore } from './config-drift-store'
import { buildDiskAnalyzerCommand } from './disk-space-collector'
import {
  buildEndpointListenersCommand,
  buildEndpointMonitorCommand,
  buildEndpointProbeCommand,
  ENDPOINT_PROBE_URLS,
} from './endpoint-monitor-collector'
import {
  buildEnvFindCommand,
  buildEnvKeysCommand,
} from './env-inspector-collector'
import { buildIncidentAnalyzerCommand } from './incident-analyzer-collector'
import { operationalTimelineStore } from './operational-timeline-store'
import {
  setCachedConfigDrift,
  setCachedDiskSpace,
  setCachedEndpoints,
  setCachedEnvInspector,
  setCachedIncident,
} from './server-intelligence-cache'
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
  async collectDiskSpace(webContentsId: number, sessionId: string): Promise<CollectDiskSpaceResponse> {
    const meta = sshSessionManager.getSessionMeta(webContentsId, sessionId)
    if (!meta) {
      throw new Error('SSH oturumu bulunamadı.')
    }

    let raw = ''

    try {
      raw = await execCollect(webContentsId, sessionId, buildDiskAnalyzerCommand(), 35_000)
    } catch {
      raw = ''
    }

    let snapshot = parseDiskAnalyzerOutput(meta.host, raw, [])

    if (!diskAnalyzerHasPayload(snapshot)) {
      const mounts = await execRemoteLine(
        webContentsId,
        sessionId,
        'df -h -P -x tmpfs -x devtmpfs 2>/dev/null | head -n 12',
      )
      const topDirs = await execRemoteLine(
        webContentsId,
        sessionId,
        'du -sk /var /home /usr /opt /tmp /var/log /var/cache 2>/dev/null | awk \'{print ($1 * 1024) "\\t" $2}\' | sort -n | tail -n 15',
      )
      raw = `===MOUNTS===\n${mounts}\n===TOP_DIRS===\n${topDirs}`
      snapshot = parseDiskAnalyzerOutput(meta.host, raw, [])
    }

    if (!diskAnalyzerHasPayload(snapshot)) {
      snapshot = {
        ...snapshot,
        warnings: [
          'Disk verisi alınamadı. du/find için yetki gerekebilir; yine de Durum sekmesindeki disk özeti çalışıyorsa Yenile’yi tekrar deneyin.',
        ],
      }
    }

    setCachedDiskSpace(sessionId, snapshot)
    return { snapshot }
  },

  async collectConfigDrift(
    webContentsId: number,
    sessionId: string,
    options?: { resetBaseline?: boolean },
  ): Promise<CollectConfigDriftResponse> {
    const meta = sshSessionManager.getSessionMeta(webContentsId, sessionId)
    if (!meta) {
      throw new Error('SSH oturumu bulunamadı.')
    }

    if (options?.resetBaseline) {
      configDriftStore.clear(meta.serverKey)
    }

    const warnings: string[] = []
    let raw = ''

    try {
      raw = await execCollect(webContentsId, sessionId, buildConfigDriftCommand(), 20_000)
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'Konfigürasyon taraması başarısız.')
    }

    const discovered = await execRemoteLine(
      webContentsId,
      sessionId,
      buildConfigDriftDiscoverCommand(),
    )
    const discoveredPaths = discovered
      .split('\n')
      .map((line) => line.replace(/\r$/, '').trim())
      .filter((line) => line.startsWith('/'))

    const targetPaths = [...new Set([...CONFIG_DRIFT_PATHS, ...discoveredPaths])].slice(0, 16)
    const fingerprintLines = ['===CONFIG_HASH===']

    for (const path of targetPaths) {
      const output = await execRemoteLine(webContentsId, sessionId, buildConfigDriftPathCommand(path))
      const matches = extractConfigFingerprintLines(output)
      if (matches.length > 0) {
        fingerprintLines.push(...matches)
      } else {
        fingerprintLines.push(`MISSING|${path}|0`)
      }
    }

    raw = `${raw}\n${fingerprintLines.join('\n')}`
    let current = parseConfigFingerprints(raw)
    if (current.length === 0) {
      current = parseConfigFingerprints(await execCollect(webContentsId, sessionId, buildConfigDriftCommand(), 20_000))
    }

    let baseline = options?.resetBaseline ? null : configDriftStore.get(meta.serverKey)

    let snapshot: ReturnType<typeof compareConfigDrift>

    if (!baseline) {
      const capturedAt = configDriftStore.save(
        meta.serverKey,
        current.map((item) => ({ path: item.path, sha256: item.sha256 })),
      )
      const stored = configDriftStore.get(meta.serverKey)
      snapshot = compareConfigDrift(meta.host, current, stored, warnings)
      snapshot = { ...snapshot, baselineCapturedAt: capturedAt, isInitialBaseline: true }
    } else {
      snapshot = compareConfigDrift(meta.host, current, baseline, warnings)
    }

    if (!configDriftHasPayload(snapshot)) {
      snapshot = {
        ...snapshot,
        warnings: [
          ...snapshot.warnings,
          'Konfig taraması çalıştırılamadı. SSH exec veya sh erişimini kontrol edin.',
        ],
      }
    } else if (snapshot.fingerprints.every((item) => !item.readable)) {
      snapshot = {
        ...snapshot,
        warnings: [
          ...snapshot.warnings,
          '/etc dosyalarına okuma yetkisi yok (DENIED). sudo veya ilgili gruba kullanıcı ekleyin.',
        ],
      }
    }

    setCachedConfigDrift(sessionId, snapshot)
    return { snapshot }
  },

  async collectEnvInspector(webContentsId: number, sessionId: string): Promise<CollectEnvInspectorResponse> {
    const meta = sshSessionManager.getSessionMeta(webContentsId, sessionId)
    if (!meta) {
      throw new Error('SSH oturumu bulunamadı.')
    }

    const warnings: string[] = []
    let raw = ''
    let execFailed = false

    try {
      raw = await execCollect(webContentsId, sessionId, buildEnvFindCommand(), 25_000)
    } catch (error) {
      execFailed = true
      warnings.push(error instanceof Error ? error.message : '.env taraması çalıştırılamadı.')
    }

    let paths = parseEnvFilePaths(raw)

    if (paths.length === 0) {
      const fallbackList = await execRemoteLine(webContentsId, sessionId, buildEnvFindCommand())
      if (fallbackList.trim()) {
        raw = `${raw}\n${fallbackList}`
        paths = parseEnvFilePaths(raw)
        if (paths.length > 0) {
          execFailed = false
        }
      }
    }

    for (const filePath of paths.slice(0, 12)) {
      const keysRaw = await execRemoteLine(webContentsId, sessionId, buildEnvKeysCommand(filePath))
      raw = `${raw}\n${keysRaw}`
    }

    const snapshot = parseEnvInspectorOutput(meta.host, raw, warnings, execFailed)

    setCachedEnvInspector(sessionId, snapshot)
    return { snapshot }
  },

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