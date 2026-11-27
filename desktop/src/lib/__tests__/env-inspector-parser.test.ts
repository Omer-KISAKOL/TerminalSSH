import { describe, expect, it } from 'vitest'

import {
  envInspectorHasPayload,
  isValidEnvFilePath,
  parseEnvInspectorOutput,
  resolveEnvScanStatus,
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
`

    const snapshot = parseEnvInspectorOutput('host', raw)
    expect(envInspectorHasPayload(snapshot)).toBe(true)
    expect(snapshot.scanStatus).toBe('ok')
    expect(snapshot.files).toHaveLength(1)
    expect(snapshot.files[0]?.keys).toEqual(['DB_HOST', 'APP_ENV'])
    expect(isValidEnvFilePath('\\nfind /home')).toBe(false)
  })

  it('treats zero files as empty not failed', () => {
    const snapshot = parseEnvInspectorOutput('host', '===ENV_FILES===\n', [], false)
    expect(snapshot.scanStatus).toBe('empty')
    expect(snapshot.warnings.some((w) => w.includes('bulunamadı'))).toBe(false)
  })

  it('marks exec failure', () => {
    expect(resolveEnvScanStatus([], true)).toBe('failed')
  })
})