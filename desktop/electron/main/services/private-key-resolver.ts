import { mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const tempDirectories = new Set<string>()

export function privateKeyResolverPath(
  privateKeyPath?: string,
  privateKeyContent?: string,
): string | undefined {
  if (privateKeyPath) {
    return privateKeyPath
  }

  if (!privateKeyContent) {
    return undefined
  }

  const tempDir = mkdtempSync(path.join(os.tmpdir(), 'terminalssh-key-'))
  tempDirectories.add(tempDir)
  const tempPath = path.join(tempDir, 'id_key')
  writeFileSync(tempPath, privateKeyContent, { mode: 0o600 })

  return tempPath
}
