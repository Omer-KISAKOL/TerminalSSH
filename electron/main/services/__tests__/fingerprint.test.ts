import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { formatHostFingerprint, makeHostKey } from '../fingerprint'

describe('makeHostKey', () => {
  it('host ve portu normalize ederek birleştirir', () => {
    expect(makeHostKey('Example.COM', 22)).toBe('example.com:22')
    expect(makeHostKey(' 192.168.1.1 ', 2222)).toBe('192.168.1.1:2222')
  })
})

describe('formatHostFingerprint', () => {
  it('SHA256 parmak izi üretir', () => {
    const hostKey = Buffer.from('test-host-key')
    const expectedBase64 = createHash('sha256').update(hostKey).digest('base64').replace(/=+$/, '')

    expect(formatHostFingerprint(hostKey)).toBe(`SHA256:${expectedBase64}`)
  })
})
