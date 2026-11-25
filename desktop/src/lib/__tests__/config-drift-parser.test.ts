import { describe, expect, it } from 'vitest'

import {
  extractConfigFingerprintLines,
  parseConfigFingerprints,
} from '@shared/server-ops/config-drift-parser'

describe('parseConfigFingerprints', () => {
  it('parses section body with readable and missing rows', () => {
    const raw = `noise
===CONFIG_HASH===
abc1230000000000000000000000000000000000000000000000000000000001|/etc/nginx/nginx.conf|120
MISSING|/etc/ufw/ufw.conf|0
`

    const items = parseConfigFingerprints(raw)
    expect(items).toHaveLength(2)
    expect(items[0]?.readable).toBe(true)
    expect(items[0]?.kind).toBe('nginx')
    expect(items[1]?.readable).toBe(false)
  })

  it('extracts fingerprint lines from noisy exec output', () => {
    const lines = extractConfigFingerprintLines(`bash: no job control\nDENIED|/etc/ssh/sshd_config|0\n`)
    expect(lines).toEqual(['DENIED|/etc/ssh/sshd_config|0'])
  })

  it('parses fingerprint lines without section marker', () => {
    const raw =
      'deadbeef00000000000000000000000000000000000000000000000000000000|\r/etc/ssh/sshd_config|4096\r\n'
    const items = parseConfigFingerprints(raw)
    expect(items).toHaveLength(1)
    expect(items[0]?.path).toBe('/etc/ssh/sshd_config')
  })
})