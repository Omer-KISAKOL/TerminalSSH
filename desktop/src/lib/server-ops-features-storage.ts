export type ServerOpsFeatureFlags = {
  intelligence: boolean
  timeline: boolean
  context: boolean
  processExplorer: boolean
  endpointMonitor: boolean
  incidentAnalyzer: boolean
}

const STORAGE_KEY = 'terminalssh-server-ops-features'

export const SERVER_OPS_FEATURES_CHANGED = 'terminalssh:server-ops-features-changed'

export const SERVER_OPS_FEATURE_KEYS = [
  'intelligence',
  'timeline',
  'context',
  'processExplorer',
  'endpointMonitor',
  'incidentAnalyzer',
] as const satisfies ReadonlyArray<keyof ServerOpsFeatureFlags>

const defaultFlags: ServerOpsFeatureFlags = {
  intelligence: true,
  timeline: true,
  context: true,
  processExplorer: true,
  endpointMonitor: true,
  incidentAnalyzer: true,
}

function mergeFlags(parsed: Partial<ServerOpsFeatureFlags> | null | undefined): ServerOpsFeatureFlags {
  return {
    intelligence:
      typeof parsed?.intelligence === 'boolean' ? parsed.intelligence : defaultFlags.intelligence,
    timeline: typeof parsed?.timeline === 'boolean' ? parsed.timeline : defaultFlags.timeline,
    context: typeof parsed?.context === 'boolean' ? parsed.context : defaultFlags.context,
    processExplorer:
      typeof parsed?.processExplorer === 'boolean'
        ? parsed.processExplorer
        : defaultFlags.processExplorer,
    endpointMonitor:
      typeof parsed?.endpointMonitor === 'boolean'
        ? parsed.endpointMonitor
        : defaultFlags.endpointMonitor,
    incidentAnalyzer:
      typeof parsed?.incidentAnalyzer === 'boolean'
        ? parsed.incidentAnalyzer
        : defaultFlags.incidentAnalyzer,
  }
}

export function loadServerOpsFeatureFlags(): ServerOpsFeatureFlags {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...defaultFlags }
    }

    const parsed = JSON.parse(raw) as Partial<ServerOpsFeatureFlags>
    return mergeFlags(parsed)
  } catch {
    return { ...defaultFlags }
  }
}

export function buildServerOpsFlagsAll(enabled: boolean): ServerOpsFeatureFlags {
  return SERVER_OPS_FEATURE_KEYS.reduce<ServerOpsFeatureFlags>(
    (accumulator, key) => {
      accumulator[key] = enabled
      return accumulator
    },
    { ...defaultFlags },
  )
}

export function saveServerOpsFeatureFlags(flags: ServerOpsFeatureFlags): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
    window.dispatchEvent(new CustomEvent(SERVER_OPS_FEATURES_CHANGED, { detail: flags }))
  } catch {
    // sessizce geç
  }
}