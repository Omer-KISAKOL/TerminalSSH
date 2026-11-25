import type {
  ConfigDriftSnapshot,
  DependencyIntelligenceSnapshot,
  DiskSpaceAnalyzerSnapshot,
  EndpointMonitorSnapshot,
  EnvironmentInspectorSnapshot,
  IncidentAnalyzerSnapshot,
  ProcessExplorerSnapshot,
  ServerIntelligenceSnapshot,
} from '@shared/contracts/server-ops'

const snapshotBySession = new Map<string, ServerIntelligenceSnapshot>()
const dependencyBySession = new Map<string, DependencyIntelligenceSnapshot>()
const processBySession = new Map<string, ProcessExplorerSnapshot>()
const diskBySession = new Map<string, DiskSpaceAnalyzerSnapshot>()
const driftBySession = new Map<string, ConfigDriftSnapshot>()
const envBySession = new Map<string, EnvironmentInspectorSnapshot>()
const endpointsBySession = new Map<string, EndpointMonitorSnapshot>()
const incidentBySession = new Map<string, IncidentAnalyzerSnapshot>()

export function getCachedIntelligence(sessionId: string): ServerIntelligenceSnapshot | null {
  return snapshotBySession.get(sessionId) ?? null
}

export function setCachedIntelligence(sessionId: string, snapshot: ServerIntelligenceSnapshot): void {
  snapshotBySession.set(sessionId, snapshot)
}

export function clearCachedIntelligence(sessionId: string): void {
  snapshotBySession.delete(sessionId)
  dependencyBySession.delete(sessionId)
  processBySession.delete(sessionId)
  diskBySession.delete(sessionId)
  driftBySession.delete(sessionId)
  envBySession.delete(sessionId)
  endpointsBySession.delete(sessionId)
  incidentBySession.delete(sessionId)
}

export function getCachedDependencies(sessionId: string): DependencyIntelligenceSnapshot | null {
  return dependencyBySession.get(sessionId) ?? null
}

export function setCachedDependencies(
  sessionId: string,
  snapshot: DependencyIntelligenceSnapshot,
): void {
  dependencyBySession.set(sessionId, snapshot)
}

export function getCachedProcesses(sessionId: string): ProcessExplorerSnapshot | null {
  return processBySession.get(sessionId) ?? null
}

export function setCachedProcesses(sessionId: string, snapshot: ProcessExplorerSnapshot): void {
  processBySession.set(sessionId, snapshot)
}

export function setCachedDiskSpace(sessionId: string, snapshot: DiskSpaceAnalyzerSnapshot): void {
  diskBySession.set(sessionId, snapshot)
}

export function setCachedConfigDrift(sessionId: string, snapshot: ConfigDriftSnapshot): void {
  driftBySession.set(sessionId, snapshot)
}

export function setCachedEnvInspector(sessionId: string, snapshot: EnvironmentInspectorSnapshot): void {
  envBySession.set(sessionId, snapshot)
}

export function setCachedEndpoints(sessionId: string, snapshot: EndpointMonitorSnapshot): void {
  endpointsBySession.set(sessionId, snapshot)
}

export function setCachedIncident(sessionId: string, snapshot: IncidentAnalyzerSnapshot): void {
  incidentBySession.set(sessionId, snapshot)
}