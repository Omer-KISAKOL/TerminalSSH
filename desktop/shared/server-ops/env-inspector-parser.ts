import { extractOpsSection } from './section'

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
  files: EnvFileSummary[]
  mismatches: EnvKeyMismatch[]
  warnings: string[]
}

const REDACTED_VALUE_PATTERN = /^\s*[A-Za-z_][A-Za-z0-9_]*\s*=/

export function parseEnvInspectorOutput(
  host: string,
  raw: string,
  warnings: string[] = [],
): EnvironmentInspectorSnapshot {
  const listing = extractOpsSection(raw, 'ENV_FILES')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const files: EnvFileSummary[] = []

  for (const filePath of listing) {
    const block = extractOpsSection(raw, `ENVKEYS:${filePath}`)
    const keys = block
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(line))

    for (const line of block.split('\n')) {
      if (REDACTED_VALUE_PATTERN.test(line) && !line.match(/^KEY:/)) {
        warnings.push('Uzak çıktıda değer sızıntısı filtrelendi; yalnızca anahtar adları kullanılıyor.')
        break
      }
    }

    files.push({ path: filePath, keys })
  }

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

  if (files.length === 0) {
    warnings.push('.env dosyası bulunamadı veya okunamadı.')
  }

  return {
    collectedAt: new Date().toISOString(),
    host,
    files,
    mismatches: mismatches.slice(0, 40),
    warnings: [...warnings],
  }
}

export function envInspectorHasPayload(snapshot: EnvironmentInspectorSnapshot): boolean {
  return snapshot.files.length > 0 || snapshot.mismatches.length > 0
}