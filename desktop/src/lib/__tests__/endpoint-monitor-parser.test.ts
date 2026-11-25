import { describe, expect, it } from 'vitest'

import {
  endpointMonitorHasPayload,
  httpProbePortsForSnapshot,
  parseEndpointMonitorOutput,
} from '@shared/server-ops/endpoint-monitor-parser'

describe('parseEndpointMonitorOutput', () => {
  it('parses probe rows and listeners with labels', () => {
    const raw = `===LISTENERS===
0 128 0.0.0.0:80 0.0.0.0:*
0 128 127.0.0.1:6379 0.0.0.0:*
===PROBE_RESULTS===
200|0.045|0|http://127.0.0.1/
`

    const snapshot = parseEndpointMonitorOutput('host', raw)
    expect(endpointMonitorHasPayload(snapshot)).toBe(true)
    expect(snapshot.probes.some((p) => p.kind === 'http' && p.httpStatus === 200)).toBe(true)
    expect(snapshot.probes.some((p) => p.kind === 'listener' && p.label === 'Redis')).toBe(true)
    expect(snapshot.probes.some((p) => p.kind === 'listener' && p.url === 'tcp://127.0.0.1:80')).toBe(
      false,
    )
  })

  it('suggests http ports from listeners', () => {
    const snapshot = parseEndpointMonitorOutput(
      'host',
      `===LISTENERS===\n0 128 0.0.0.0:8090 0.0.0.0:*\n0 128 127.0.0.1:6379 0.0.0.0:*`,
    )
    const ports = httpProbePortsForSnapshot(snapshot)
    expect(ports).toContain(8090)
    expect(ports).not.toContain(6379)
  })

  it('does not duplicate caller warnings in the parsed list', () => {
    const shared: string[] = ['exec timeout']
    const snapshot = parseEndpointMonitorOutput('host', '', shared)
    expect(shared).toHaveLength(1)
    expect(snapshot.warnings).toEqual(['exec timeout'])
  })
})