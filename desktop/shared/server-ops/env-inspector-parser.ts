import { extractOpsSection } from './section'

export type EnvInspectorScanStatus = 'ok' | 'empty' | 'partial' | 'failed'

export interface EnvFileSummary {
  path: string
  keys: string[]
}

export interface EnvKeyMismatch {
  key: string
  presentIn: string[]
  missingIn: string[]
}

export interface EnvironmentInspectorSnapshot {
  collectedAt: string
  host: string
  scanStatus: EnvInspectorScanStatus
  files: EnvFileSummary[]
  mismatches: EnvKeyMismatch[]
  warnings: string[]
}

const REDACTED_VALUE_PATTERN = /^\s*[A-Za-z_][A-Za-z0-9_]*\s*=/
const ENV_PATH_PATTERN = /^\/[^\s']+\.env([\w.-]*)?$/

export function isValidEnvFilePath(path: string): boolean {
  const trimmed = path.replace(/\r$/, '').trim()
  if (!ENV_PATH_PATTERN.test(trimmed)) {
    return false
  }

  if (/find\s+\//.test(trimmed) || trimmed.includes('/bin/sh') || trimmed.includes('sh -c')) {
    return false
  }

  return true
}

export function parseEnvFilePaths(raw: string): string[] {
  const listing = extractOpsSection(raw, 'ENV_FILES')
  const paths = new Set<string>()

  for (const line of listing.split('\n')) {
    const trimmed = line.replace(/\r$/, '').trim()
    if (isValidEnvFilePath(trimmed)) {
      paths.add(trimmed)
    }
  }

  for (const line of raw.split('\n')) {
    const trimmed = line.replace(/\r$/, '').trim()
    if (isValidEnvFilePath(trimmed)) {
      paths.add(trimmed)
    }
  }

  return [...paths]
}

function parseKeysForPath(raw: string, filePath: string): string[] {
  const block = extractOpsSection(raw, `ENVKEYS:${filePath}`)
  const keySet = new Set<string>()

  for (const line of block.split('\n')) {
    const trimmed = line.replace(/\r$/, '').trim()
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
      keySet.add(trimmed)
    }
  }

  return [...keySet]
}

export function resolveEnvScanStatus(
  files: EnvFileSummary[],
  execFailed: boolean,
): EnvInspectorScanStatus {
  if (execFailed && files.length === 0) {
    return 'failed'
  }

  if (files.length === 0) {
    return 'empty'
  }

  if (files.every((file) => file.keys.length === 0)) {
    return 'partial'
  }

  return 'ok'
}

export function parseEnvInspectorOutput(
  host: string,
  raw: string,
  extraWarnings: string[] = [],
  execFailed = false,
): EnvironmentInspectorSnapshot {
  const warnings = [...extraWarnings]
  const paths = parseEnvFilePaths(raw)
  const files: EnvFileSummary[] = []

  for (const filePath of paths) {
    const block = extractOpsSection(raw, `ENVKEYS:${filePath}`)
    const keys = parseKeysForPath(raw, filePath)

    for (const line of block.split('\n')) {
      if (REDACTED_VALUE_PATTERN.test(line) && !/^KEY:/.test(line)) {
        if (
          !warnings.includes(
            'Uzak çıktıda değer sızıntısı filtrelendi; yalnızca anahtar adları kullanılıyor.',
          )
        ) {
          warnings.push(
            'Uzak çıktıda değer sızıntısı filtrelendi; yalnızca anahtar adları kullanılıyor.',
          )
        }
        break
      }
    }

    files.push({ path: filePath, keys })
  }

  const scanStatus = resolveEnvScanStatus(files, execFailed)

  const keyToFiles = new Map<string, string[]>()
  for (const file of files) {
    for (const key of file.keys) {
      const list = keyToFiles.get(key) ?? []
      list.push(file.path)
      keyToFiles.set(key, list)
    }
  }

  const allPaths = files.map((file) => file.path)
  const mismatches: EnvKeyMismatch[] = []

  for (const [key, presentIn] of keyToFiles) {
    const missingIn = allPaths.filter((path) => !presentIn.includes(path))
    if (missingIn.length > 0 && presentIn.length < allPaths.length) {
      mismatches.push({ key, presentIn, missingIn })
    }
  }

  if (scanStatus === 'partial') {
    warnings.push('Bazı .env dosyaları bulundu ama anahtar okunamadı (dosya izni gerekebilir).')
  }

  return {
    collectedAt: new Date().toISOString(),
    host,
    scanStatus,
    files,
    mismatches: mismatches.slice(0, 40),
    warnings,
  }
}

export function envInspectorHasPayload(snapshot: EnvironmentInspectorSnapshot): boolean {
  return snapshot.files.length > 0
}