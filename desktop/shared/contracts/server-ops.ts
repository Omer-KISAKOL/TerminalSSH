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

export type { DependencyIntelligenceSnapshot, DependencyNode, DependencyEdge } from '../server-ops/dependency-parser'
export type { ProcessExplorerSnapshot, ProcessTreeNode } from '../server-ops/process-parser'

export interface CollectDependencyIntelligenceResponse {
  snapshot: import('../server-ops/dependency-parser').DependencyIntelligenceSnapshot
}

export interface CollectProcessExplorerResponse {
  snapshot: import('../server-ops/process-parser').ProcessExplorerSnapshot
}

export type { DiskSpaceAnalyzerSnapshot, DiskUsageItem } from '../server-ops/disk-analyzer-parser'
export type { ConfigDriftSnapshot, ConfigDriftChange } from '../server-ops/config-drift-parser'
export type { EnvironmentInspectorSnapshot, EnvFileSummary } from '../server-ops/env-inspector-parser'
export type { EndpointMonitorSnapshot, EndpointProbeResult } from '../server-ops/endpoint-monitor-parser'
export type { IncidentAnalyzerSnapshot, IncidentSignal } from '../server-ops/incident-analyzer-parser'

export interface CollectDiskSpaceResponse {
  snapshot: import('../server-ops/disk-analyzer-parser').DiskSpaceAnalyzerSnapshot
}

export interface CollectConfigDriftResponse {
  snapshot: import('../server-ops/config-drift-parser').ConfigDriftSnapshot
}

export interface CollectConfigDriftRequest {
  sessionId: string
  resetBaseline?: boolean
}

export interface CollectEnvInspectorResponse {
  snapshot: import('../server-ops/env-inspector-parser').EnvironmentInspectorSnapshot
}

export interface CollectEndpointMonitorResponse {
  snapshot: import('../server-ops/endpoint-monitor-parser').EndpointMonitorSnapshot
}

export interface CollectIncidentAnalyzerResponse {
  snapshot: import('../server-ops/incident-analyzer-parser').IncidentAnalyzerSnapshot
}