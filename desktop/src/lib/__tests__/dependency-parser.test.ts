import { describe, expect, it } from 'vitest'

import { parseDependencyOutput } from '@shared/server-ops/dependency-parser'

describe('parseDependencyOutput', () => {
  it('builds nodes from listen and systemd sections', () => {
    const raw = `===LISTEN===
LISTEN 0 128 0.0.0.0:80 0.0.0.0:* users:(("nginx",pid=10,fd=3))
LISTEN 0 128 127.0.0.1:5432 0.0.0.0:* users:(("postgres",pid=20,fd=3))
===SYSTEMD===
nginx.service
postgresql.service
===DOCKER===

===PROXY===
proxy_pass http://127.0.0.1:3000;
`

    const snapshot = parseDependencyOutput('host', raw)
    expect(snapshot.nodes.length).toBeGreaterThanOrEqual(2)
    expect(snapshot.edges.some((edge) => edge.label === 'proxies')).toBe(true)
  })
})