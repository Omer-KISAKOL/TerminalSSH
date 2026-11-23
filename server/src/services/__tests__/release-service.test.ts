import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { checkRelease, compareSemver } from '../release-service.js'

const manifestPath = fileURLToPath(new URL('../../../data/releases.json', import.meta.url))

describe('compareSemver', () => {
  it('detects newer patch version', () => {
    expect(compareSemver('2.0.1', '2.0.0')).toBe(1)
    expect(compareSemver('2.0.0', '2.0.1')).toBe(-1)
    expect(compareSemver('2.0.0', '2.0.0')).toBe(0)
  })
})

describe('checkRelease', () => {
  it('returns update when manifest version is newer', () => {
    const result = checkRelease('desktop-windows', '1.0.0', manifestPath)

    expect(result.updateAvailable).toBe(true)
    expect(result.latestVersion).toBe('2.0.0')
    expect(result.downloadUrl).toContain('https://')
  })
})