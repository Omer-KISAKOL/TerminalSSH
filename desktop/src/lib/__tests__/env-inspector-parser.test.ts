import { describe, expect, it } from 'vitest'

import {
  envInspectorHasPayload,
  isValidEnvFilePath,
  parseEnvInspectorOutput,
} from '@shared/server-ops/env-inspector-parser'

describe('parseEnvInspectorOutput', () => {
  it('ignores shell noise and parses keys by file', () => {
    const raw = `noise
===ENV_FILES===
/var/www/app/.env
\\nfind /home
===ENVKEYS:/var/www/app/.env===
DB_HOST
APP_ENV
export broken should not appear
`

    const snapshot = parseEnvInspectorOutput('host', raw)
    expect(envInspectorHasPayload(snapshot)).toBe(true)
    expect(snapshot.files).toHaveLength(1)
    expect(snapshot.files[0]?.keys).toEqual(['DB_HOST', 'APP_ENV'])
    expect(isValidEnvFilePath('\\nfind /home')).toBe(false)
  })

  it('marks empty key files with warning', () => {
    const snapshot = parseEnvInspectorOutput('host', `===ENV_FILES===\n/opt/app/.env\n===ENVKEYS:/opt/app/.env===\n`)
    expect(snapshot.files[0]?.keys).toEqual([])
    expect(snapshot.warnings.some((w) => w.includes('anahtar okunamadı'))).toBe(true)
  })
})