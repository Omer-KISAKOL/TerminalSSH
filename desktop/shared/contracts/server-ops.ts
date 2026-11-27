export type OperationalTimelineEventType =
  | 'connect'
  | 'disconnect'
  | 'command'
  | 'intelligence'
  | 'suggestion'

export interface OperationalTimelineEvent {
  id: string
  serverKey: string
  host: string
  profileId: string | null
  profileName: string | null
  type: OperationalTimelineEventType
  summary: string
  detail: string | null
  createdAt: string
}

export interface ServerMemorySnapshot {
  totalBytes: number | null
  usedBytes: number | null
  availableBytes: number | null
  /** free -h gibi çıktılarda ham özet */
  summary?: string | null
}

export interface ServerDiskSnapshot {
  filesystem: string
  size: string
  used: string
  available: string
  usePercent: string
  mountpoint: string
}

export interface ServerIntelligenceSnapshot {
  collectedAt: string
  host: string
  hostname: string | null
  osName: string | null
  osVersion: string | null
  kernel: string | null
  uptime: string | null
  loadAverage: string | null
  memory: ServerMemorySnapshot | null
  disks: ServerDiskSnapshot[]
  runningServices: string[]
  detectedTools: string[]
  warnings: string[]
}

export type ContextSuggestionCategory = 'diagnostics' | 'service' | 'logs' | 'docker' | 'network'

export interface ContextCommandSuggestion {
  id: string
  label: string
  command: string
  description: string
  category: ContextSuggestionCategory
}

export interface CollectIntelligenceRequest {
  sessionId: string
}

export interface CollectIntelligenceResponse {
  snapshot: ServerIntelligenceSnapshot
  suggestions: ContextCommandSuggestion[]
}

export interface ListTimelineRequest {
  serverKey: string
  limit?: number
}

export interface ListTimelineResponse {
  events: OperationalTimelineEvent[]
  serverKey: string
  retentionDays: number
}

export interface GetServerOpsContextRequest {
  sessionId: string
}

export interface ServerOpsContextResponse {
  serverKey: string
  host: string
  profileId: string | null
  profileName: string | null
  snapshot: ServerIntelligenceSnapshot | null
  suggestions: ContextCommandSuggestion[]
}

export type { ProcessExplorerSnapshot, ProcessTreeNode } from '../server-ops/process-parser'

export interface CollectProcessExplorerResponse {
  snapshot: import('../server-ops/process-parser').ProcessExplorerSnapshot
}

export type { EndpointMonitorSnapshot, EndpointProbeResult } from '../server-ops/endpoint-monitor-parser'
export type { IncidentAnalyzerSnapshot, IncidentSignal } from '../server-ops/incident-analyzer-parser'

export interface CollectEndpointMonitorResponse {
  snapshot: import('../server-ops/endpoint-monitor-parser').EndpointMonitorSnapshot
}

export interface CollectIncidentAnalyzerResponse {
  snapshot: import('../server-ops/incident-analyzer-parser').IncidentAnalyzerSnapshot
}