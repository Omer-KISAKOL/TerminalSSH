import type {
  CollectIntelligenceResponse,
  CollectProcessExplorerResponse,
  ListTimelineResponse,
  ServerOpsContextResponse,
} from '@shared/contracts/server-ops'
import { OPERATIONAL_TIMELINE_RETENTION_DAYS } from '@shared/constants/timeline'

import { buildContextSuggestions } from './context-suggestion-engine'
import {
  buildIntelligenceCommand,
  intelligenceHasPayload,
  parseIntelligenceOutput,
} from './server-intelligence-collector'
import { operationalTimelineStore } from './operational-timeline-store'
import {
  buildProcessExplorerCommand,
  parseProcessExplorerOutput,
  processExplorerHasPayload,
} from './process-explorer-collector'
import {
  clearCachedIntelligence,
  getCachedIntelligence,
  setCachedIntelligence,
  setCachedProcesses,
} from './server-intelligence-cache'
import { sshSessionManager } from './ssh-session-manager'

async function execRemoteLine(
  webContentsId: number,
  sessionId: string,
  command: string,
): Promise<string> {
  try {
    const result = await sshSessionManager.exec(webContentsId, sessionId, command, 12_000)
    const merged = `${result.stdout}\n${result.stderr}`.trim()
    return merged
  } catch {
    return ''
  }
}

async function collectIntelligenceFallback(
  webContentsId: number,
  sessionId: string,
): Promise<string> {
  const metaBlock = [
    await execRemoteLine(webContentsId, sessionId, 'uname -a 2>/dev/null || uname 2>/dev/null'),
    await execRemoteLine(
      webContentsId,
      sessionId,
      'hostname 2>/dev/null || uname -n 2>/dev/null',
    ),
  ]
    .filter(Boolean)
    .join('\n')

  const chunks = [
    '===META===',
    metaBlock,
    '===UPTIME===',
    await execRemoteLine(webContentsId, sessionId, 'uptime 2>/dev/null'),
    '===MEM===',
    await execRemoteLine(
      webContentsId,
      sessionId,
      'free -b 2>/dev/null || free 2>/dev/null || cat /proc/meminfo 2>/dev/null | head -n 4',
    ),
    '===DISK===',
    await execRemoteLine(
      webContentsId,
      sessionId,
      'df -h -P -x tmpfs -x devtmpfs 2>/dev/null | head -n 20',
    ),
    '===OS===',
    await execRemoteLine(webContentsId, sessionId, 'cat /etc/os-release 2>/dev/null | head -n 12'),
    '===SERVICES===',
    await execRemoteLine(
      webContentsId,
      sessionId,
      'systemctl list-units --type=service --state=running --no-pager --no-legend 2>/dev/null | awk \'{print $1}\' | head -n 25',
    ),
    '===TOOLS===',
    await execRemoteLine(
      webContentsId,
      sessionId,
      'for c in docker docker-compose nginx node npm pm2 python3 php; do command -v "$c" >/dev/null 2>&1 && echo "$c"; done',
    ),
  ]

  return chunks.join('\n')
}

export const serverOpsService = {
  getContext(webContentsId: number, sessionId: string): ServerOpsContextResponse {
    const meta = sshSessionManager.getSessionMeta(webContentsId, sessionId)

    if (!meta) {
      throw new Error('SSH oturumu bulunamadı.')
    }

    const snapshot = getCachedIntelligence(sessionId)

    return {
      serverKey: meta.serverKey,
      host: meta.host,
      profileId: meta.profileId,
      profileName: meta.profileName,
      snapshot,
      suggestions: buildContextSuggestions(snapshot),
    }
  },

  async collectIntelligence(
    webContentsId: number,
    sessionId: string,
  ): Promise<CollectIntelligenceResponse> {
    const meta = sshSessionManager.getSessionMeta(webContentsId, sessionId)

    if (!meta) {
      throw new Error('SSH oturumu bulunamadı.')
    }

    const command = buildIntelligenceCommand()
    const warnings: string[] = []
    let raw = ''

    try {
      const result = await sshSessionManager.exec(webContentsId, sessionId, command, 25_000)
      raw = `${result.stdout}\n${result.stderr}`.trim()

      if (result.code !== 0 && !raw) {
        warnings.push(`Toplama komutu çıkış kodu: ${result.code ?? 'bilinmiyor'}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Toplama başarısız.'
      warnings.push(message)
    }

    let snapshot = parseIntelligenceOutput(meta.host, raw, [...warnings])

    if (!intelligenceHasPayload(snapshot)) {
      const fallbackRaw = await collectIntelligenceFallback(webContentsId, sessionId)
      if (fallbackRaw.trim().length > 0) {
        const fallbackWarnings: string[] = []
        raw = fallbackRaw
        snapshot = parseIntelligenceOutput(meta.host, raw, fallbackWarnings)
        if (intelligenceHasPayload(snapshot)) {
          snapshot = { ...snapshot, warnings: fallbackWarnings }
        } else {
          warnings.push('Birleşik tarama boş döndü; tekil SSH komutları da yetersiz kaldı.')
          snapshot = { ...snapshot, warnings: [...warnings, ...fallbackWarnings] }
        }
      } else {
        warnings.push('Birleşik tarama boş döndü; tekil SSH komutları denenemedi.')
        snapshot = { ...snapshot, warnings: [...snapshot.warnings, ...warnings] }
      }
    }

    if (!intelligenceHasPayload(snapshot)) {
      warnings.push(
        'Sunucudan sistem verisi alınamadı. SSH exec devre dışı olabilir (ör. SFTP-only hesap) veya oturum henüz hazır değil.',
      )
    }

    setCachedIntelligence(sessionId, snapshot)

    operationalTimelineStore.append({
      serverKey: meta.serverKey,
      host: meta.host,
      profileId: meta.profileId,
      profileName: meta.profileName,
      type: 'intelligence',
      summary: 'Sunucu bilgisi yenilendi',
      detail: snapshot.hostname ?? snapshot.kernel,
    })

    const suggestions = buildContextSuggestions(snapshot)

    return { snapshot, suggestions }
  },

  listTimeline(serverKey: string, limit?: number): ListTimelineResponse {
    return {
      serverKey,
      retentionDays: OPERATIONAL_TIMELINE_RETENTION_DAYS,
      events: operationalTimelineStore.list(serverKey, limit ?? 80),
    }
  },

  clearSessionCache(sessionId: string): void {
    clearCachedIntelligence(sessionId)
  },

  async collectProcesses(
    webContentsId: number,
    sessionId: string,
  ): Promise<CollectProcessExplorerResponse> {
    const meta = sshSessionManager.getSessionMeta(webContentsId, sessionId)

    if (!meta) {
      throw new Error('SSH oturumu bulunamadı.')
    }

    const warnings: string[] = []
    let raw = ''

    try {
      const result = await sshSessionManager.exec(
        webContentsId,
        sessionId,
        buildProcessExplorerCommand(),
        15_000,
      )
      raw = `${result.stdout}\n${result.stderr}`.trim()
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'İşlem listesi alınamadı.')
    }

    let snapshot = parseProcessExplorerOutput(meta.host, raw, warnings)

    if (!processExplorerHasPayload(snapshot)) {
      const fallback = await execRemoteLine(
        webContentsId,
        sessionId,
        'ps -eo pid=,ppid=,pcpu=,pmem=,rss=,comm= --sort=-pcpu 2>/dev/null | head -n 60',
      )
      raw = `===PROCESSES===\n${fallback}`
      snapshot = parseProcessExplorerOutput(meta.host, raw, warnings)
    }

    if (!processExplorerHasPayload(snapshot)) {
      warnings.push('İşlem ağacı boş. ps komutu engellenmiş veya oturum hazır değil.')
      snapshot = { ...snapshot, warnings: [...snapshot.warnings, ...warnings] }
    }

    setCachedProcesses(sessionId, snapshot)

    operationalTimelineStore.append({
      serverKey: meta.serverKey,
      host: meta.host,
      profileId: meta.profileId,
      profileName: meta.profileName,
      type: 'intelligence',
      summary: 'İşlem gezgini yenilendi',
      detail: `${snapshot.flatCount} işlem`,
    })

    return { snapshot }
  },

  recordSuggestion(
    webContentsId: number,
    sessionId: string,
    input: { label: string; command: string },
  ): void {
    const meta = sshSessionManager.getSessionMeta(webContentsId, sessionId)

    if (!meta) {
      return
    }

    operationalTimelineStore.append({
      serverKey: meta.serverKey,
      host: meta.host,
      profileId: meta.profileId,
      profileName: meta.profileName,
      type: 'suggestion',
      summary: `Öneri onaylandı: ${input.label}`,
      detail: input.command,
    })
  },
}