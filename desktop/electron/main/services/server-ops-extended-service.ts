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
  parseConfigFingerprints,
} from '@shared/server-ops/config-drift-parser'
import {
  diskAnalyzerHasPayload,
  parseDiskAnalyzerOutput,
} from '@shared/server-ops/disk-analyzer-parser'
import {
  endpointMonitorHasPayload,
  parseEndpointMonitorOutput,
} from '@shared/server-ops/endpoint-monitor-parser'
import {
  envInspectorHasPayload,
  parseEnvInspectorOutput,
} from '@shared/server-ops/env-inspector-parser'
import { buildIncidentAnalyzerSnapshot, incidentAnalyzerHasPayload } from '@shared/server-ops/incident-analyzer-parser'

import { buildConfigDriftCommand } from './config-drift-collector'
import { configDriftStore } from './config-drift-store'
import { buildDiskAnalyzerCommand } from './disk-space-collector'
import { buildEndpointMonitorCommand } from './endpoint-monitor-collector'
import { buildEnvInspectorCommand } from './env-inspector-collector'
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

    const warnings: string[] = []
    let raw = ''

    try {
      raw = await execCollect(webContentsId, sessionId, buildDiskAnalyzerCommand(), 35_000)
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'Disk analizi başarısız.')
    }

    let snapshot = parseDiskAnalyzerOutput(meta.host, raw, warnings)

    if (!diskAnalyzerHasPayload(snapshot)) {
      const topDirs = await execRemoteLine(
        webContentsId,
        sessionId,
        'du -x -sk --max-depth=1 /var /home 2>/dev/null | awk \'NF>=2 {print ($1 * 1024) "\\t" $2}\' | sort -n | tail -n 15',
      )
      const mounts = await execRemoteLine(
        webContentsId,
        sessionId,
        'df -h -P -x tmpfs -x devtmpfs 2>/dev/null | head -n 12',
      )
      raw = `===MOUNTS===\n${mounts}\n===TOP_DIRS===\n${topDirs}`
      snapshot = parseDiskAnalyzerOutput(meta.host, raw, warnings)
    }

    if (!diskAnalyzerHasPayload(snapshot)) {
      warnings.push(
        'Disk verisi alınamadı. Oturumun shell (SFTP-only değil) olduğundan ve du/df komutlarının çalıştığından emin olun.',
      )
      snapshot = { ...snapshot, warnings: [...snapshot.warnings, ...warnings] }
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

    const current = parseConfigFingerprints(raw)
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
      warnings.push('Konfigürasyon dosyaları okunamadı.')
      snapshot = { ...snapshot, warnings: [...snapshot.warnings, ...warnings] }
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

    try {
      raw = await execCollect(webContentsId, sessionId, buildEnvInspectorCommand(), 25_000)
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : '.env incelemesi başarısız.')
    }

    let snapshot = parseEnvInspectorOutput(meta.host, raw, warnings)
    if (!envInspectorHasPayload(snapshot)) {
      snapshot = { ...snapshot, warnings: [...snapshot.warnings, ...warnings] }
    }

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
    if (!endpointMonitorHasPayload(snapshot)) {
      snapshot = { ...snapshot, warnings: [...snapshot.warnings, ...warnings] }
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