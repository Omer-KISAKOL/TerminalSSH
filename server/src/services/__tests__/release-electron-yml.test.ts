import { describe, expect, it } from 'vitest'

import { parseElectronBuilderFeedYaml, readElectronFeed } from '../release-electron-yml.js'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const electronDir = path.dirname(
  fileURLToPath(new URL('../../../data/releases/electron/latest.yml', import.meta.url)),
)

describe('parseElectronBuilderFeedYaml', () => {
  it('reads version and path from Windows feed', () => {
    const raw = `version: 2.0.0
files:
  - url: TerminalSSH Setup 2.0.0.exe
path: TerminalSSH Setup 2.0.0.exe`

    const parsed = parseElectronBuilderFeedYaml(raw)

    expect(parsed).toEqual({
      version: '2.0.0',
      fileName: 'TerminalSSH Setup 2.0.0.exe',
    })
  })
})

describe('readElectronFeed', () => {
  it('loads desktop-windows feed from data dir', () => {
    const feed = readElectronFeed('desktop-windows', electronDir)

    expect(feed?.version).toBe('2.0.0')
    expect(feed?.fileName).toContain('.exe')
  })
})