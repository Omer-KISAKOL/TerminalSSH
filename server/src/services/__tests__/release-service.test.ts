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
  it('uses electron feed version and platform-specific download URL', () => {
    const result = checkRelease('desktop-windows', '1.0.0', {
      manifestPath,
      publicReleaseBaseUrl: 'http://188.34.155.223:8787',
    })

    expect(result.updateAvailable).toBe(true)
    expect(result.latestVersion).toBe('2.0.0')
    expect(result.downloadUrl).toContain('/releases/electron/')
    expect(result.downloadUrl).toContain('.exe')
  })

  it('resolves linux platform feed file', () => {
    const result = checkRelease('desktop-linux', '0.0.1', {
      manifestPath,
      publicReleaseBaseUrl: 'http://example.com',
    })

    expect(result.latestVersion).toBeTruthy()
  })
})