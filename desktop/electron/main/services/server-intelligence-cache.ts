import type {
  EndpointMonitorSnapshot,
  IncidentAnalyzerSnapshot,
  ProcessExplorerSnapshot,
  ServerIntelligenceSnapshot,
} from '@shared/contracts/server-ops'

const snapshotBySession = new Map<string, ServerIntelligenceSnapshot>()
const processBySession = new Map<string, ProcessExplorerSnapshot>()
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
  processBySession.delete(sessionId)
  endpointsBySession.delete(sessionId)
  incidentBySession.delete(sessionId)
}

export function getCachedProcesses(sessionId: string): ProcessExplorerSnapshot | null {
  return processBySession.get(sessionId) ?? null
}

export function setCachedProcesses(sessionId: string, snapshot: ProcessExplorerSnapshot): void {
  processBySession.set(sessionId, snapshot)
}

export function setCachedEndpoints(sessionId: string, snapshot: EndpointMonitorSnapshot): void {
  endpointsBySession.set(sessionId, snapshot)
}

export function setCachedIncident(sessionId: string, snapshot: IncidentAnalyzerSnapshot): void {
  incidentBySession.set(sessionId, snapshot)
}