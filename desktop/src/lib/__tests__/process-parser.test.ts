import { describe, expect, it } from 'vitest'

import { buildProcessTree, parseFlatProcessLines, parseProcessExplorerOutput } from '@shared/server-ops/process-parser'

describe('process-parser', () => {
  it('parses ps lines and nests children', () => {
    const section = `1 0 0.5 1.0 1024 systemd
10 1 2.0 0.5 512 nginx
11 10 5.0 0.3 256 worker`

    const flat = parseFlatProcessLines(section)
    expect(flat).toHaveLength(3)

    const roots = buildProcessTree(flat)
    expect(roots).toHaveLength(1)
    expect(roots[0]?.children[0]?.children[0]?.command).toBe('worker')
  })

  it('parses full snapshot section', () => {
    const raw = `===PROCESSES===
1 0 0.1 0.2 100 init
2 1 1.0 0.3 200 node`

    const snapshot = parseProcessExplorerOutput('host', raw)
    expect(snapshot.flatCount).toBe(2)
    expect(snapshot.roots.length).toBeGreaterThan(0)
  })
})