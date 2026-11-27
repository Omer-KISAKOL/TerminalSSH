export type ServerOpsFeatureFlags = {
  intelligence: boolean
  timeline: boolean
  context: boolean
  dependencyIntelligence: boolean
  processExplorer: boolean
  diskSpaceAnalyzer: boolean
  configDriftDetector: boolean
  environmentInspector: boolean
  endpointMonitor: boolean
  incidentAnalyzer: boolean
}

const STORAGE_KEY = 'terminalssh-server-ops-features'

export const SERVER_OPS_FEATURES_CHANGED = 'terminalssh:server-ops-features-changed'

export const SERVER_OPS_FEATURE_KEYS = [
  'intelligence',
  'timeline',
  'context',
  'dependencyIntelligence',
  'processExplorer',
  'diskSpaceAnalyzer',
  'configDriftDetector',
  'environmentInspector',
  'endpointMonitor',
  'incidentAnalyzer',
] as const satisfies ReadonlyArray<keyof ServerOpsFeatureFlags>

const defaultFlags: ServerOpsFeatureFlags = {
  intelligence: true,
  timeline: true,
  context: true,
  dependencyIntelligence: true,
  processExplorer: true,
  diskSpaceAnalyzer: true,
  configDriftDetector: true,
  environmentInspector: true,
  endpointMonitor: true,
  incidentAnalyzer: true,
}

function mergeFlags(parsed: Partial<ServerOpsFeatureFlags> | null | undefined): ServerOpsFeatureFlags {
  return {
    intelligence:
      typeof parsed?.intelligence === 'boolean' ? parsed.intelligence : defaultFlags.intelligence,
    timeline: typeof parsed?.timeline === 'boolean' ? parsed.timeline : defaultFlags.timeline,
    context: typeof parsed?.context === 'boolean' ? parsed.context : defaultFlags.context,
    dependencyIntelligence:
      typeof parsed?.dependencyIntelligence === 'boolean'
        ? parsed.dependencyIntelligence
        : defaultFlags.dependencyIntelligence,
    processExplorer:
      typeof parsed?.processExplorer === 'boolean'
        ? parsed.processExplorer
        : defaultFlags.processExplorer,
    diskSpaceAnalyzer:
      typeof parsed?.diskSpaceAnalyzer === 'boolean'
        ? parsed.diskSpaceAnalyzer
        : defaultFlags.diskSpaceAnalyzer,
    configDriftDetector:
      typeof parsed?.configDriftDetector === 'boolean'
        ? parsed.configDriftDetector
        : defaultFlags.configDriftDetector,
    environmentInspector:
      typeof parsed?.environmentInspector === 'boolean'
        ? parsed.environmentInspector
        : defaultFlags.environmentInspector,
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