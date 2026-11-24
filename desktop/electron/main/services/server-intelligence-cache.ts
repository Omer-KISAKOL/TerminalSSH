import type { ServerIntelligenceSnapshot } from '@shared/contracts/server-ops'

const snapshotBySession = new Map<string, ServerIntelligenceSnapshot>()

export function getCachedIntelligence(sessionId: string): ServerIntelligenceSnapshot | null {
  return snapshotBySession.get(sessionId) ?? null
}

export function setCachedIntelligence(sessionId: string, snapshot: ServerIntelligenceSnapshot): void {
  snapshotBySession.set(sessionId, snapshot)
}

export function clearCachedIntelligence(sessionId: string): void {
  snapshotBySession.delete(sessionId)
}