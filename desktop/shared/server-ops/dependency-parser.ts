export type DependencyNodeKind = 'service' | 'listener' | 'container' | 'proxy'

export interface DependencyNode {
  id: string
  label: string
  kind: DependencyNodeKind
  detail: string | null
}

export interface DependencyEdge {
  id: string
  fromId: string
  toId: string
  label: string
}

export interface DependencyIntelligenceSnapshot {
  collectedAt: string
  host: string
  nodes: DependencyNode[]
  edges: DependencyEdge[]
  impactedByNodeId: Record<string, string[]>
  warnings: string[]
}

import { extractOpsSection } from './section'

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function parseListenProcesses(sectionText: string): Array<{ port: number; process: string; addr: string }> {
  const items: Array<{ port: number; process: string; addr: string }> = []

  for (const line of sectionText.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || /^State\b/i.test(trimmed)) {
    continue
  }

    const portMatch =
      trimmed.match(/(?:\d{1,3}\.){3}\d{1,3}:(\d+)/) ??
      trimmed.match(/\[?::\]?:(\d+)/) ??
      trimmed.match(/:(\d+)(?:\s|\))/)
    if (!portMatch) {
      continue
    }

    const port = Number(portMatch[1])
    if (!Number.isFinite(port)) {
      continue
    }

    const procMatch =
      trimmed.match(/users:\(\("([^"]+)"/) ??
      trimmed.match(/users:\(\("([^"]+)",/) ??
      trimmed.match(/\s+([a-zA-Z0-9_.-]+)\s*$/)

    const process = procMatch?.[1] ?? 'unknown'
    const addrMatch = trimmed.match(/(\d+\.\d+\.\d+\.\d+|:::|\*):\d+/)
    const addr = addrMatch?.[1] ?? '*'

    items.push({ port, process, addr })
  }

  return items
}

function parseDocker(sectionText: string): Array<{ name: string; image: string; ports: string }> {
  const rows: Array<{ name: string; image: string; ports: string }> = []

  for (const line of sectionText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('CONTAINER')) {
      continue
    }

    const parts = trimmed.split('|')
    if (parts.length < 2) {
      continue
    }

    rows.push({
      name: parts[0]?.trim() ?? 'container',
      image: parts[2]?.trim() ?? parts[1]?.trim() ?? '',
      ports: parts[1]?.trim() ?? '',
    })
  }

  return rows
}

function parseSystemdUnits(sectionText: string): string[] {
  return sectionText
    .split('\n')
    .map((line) => line.trim().replace(/\.service$/i, ''))
    .filter(Boolean)
    .slice(0, 40)
}

function parseProxyTargets(sectionText: string): Array<{ source: string; targetHost: string; targetPort: number }> {
  const targets: Array<{ source: string; targetHost: string; targetPort: number }> = []

  for (const line of sectionText.split('\n')) {
    const trimmed = line.trim()
    const match = trimmed.match(/proxy_pass\s+https?:\/\/([^:;\s]+):?(\d+)?/i)
    if (!match) {
      continue
    }

    const targetHost = match[1] ?? '127.0.0.1'
    const targetPort = match[2] ? Number(match[2]) : 80

    if (!Number.isFinite(targetPort)) {
      continue
    }

    const source = trimmed.includes('nginx') ? 'nginx' : 'proxy'

    targets.push({ source, targetHost, targetPort })
  }

  return targets
}

function buildImpactMap(nodes: DependencyNode[], edges: DependencyEdge[]): Record<string, string[]> {
  const reverse = new Map<string, string[]>()

  for (const edge of edges) {
    const list = reverse.get(edge.toId) ?? []
    list.push(edge.fromId)
    reverse.set(edge.toId, list)
  }

  const byId = new Map(nodes.map((node) => [node.id, node]))
  const result: Record<string, string[]> = {}

  for (const node of nodes) {
    const affected = new Set<string>()
    const stack = [...(reverse.get(node.id) ?? [])]

    while (stack.length > 0) {
      const id = stack.pop()
      if (!id || affected.has(id)) {
        continue
      }

      affected.add(id)
      const upstream = reverse.get(id) ?? []
      for (const next of upstream) {
        stack.push(next)
      }
    }

    result[node.id] = [...affected]
      .map((id) => byId.get(id)?.label ?? id)
      .filter((label, index, arr) => arr.indexOf(label) === index)
  }

  return result
}

export function dependencyHasPayload(snapshot: DependencyIntelligenceSnapshot): boolean {
  return snapshot.nodes.length > 0 || snapshot.edges.length > 0
}

export function parseDependencyOutput(
  host: string,
  raw: string,
  warnings: string[] = [],
): DependencyIntelligenceSnapshot {
  const listen = parseListenProcesses(extractOpsSection(raw, 'LISTEN'))
  const docker = parseDocker(extractOpsSection(raw, 'DOCKER'))
  const systemd = parseSystemdUnits(extractOpsSection(raw, 'SYSTEMD'))
  const proxies = parseProxyTargets(extractOpsSection(raw, 'PROXY'))

  const nodes: DependencyNode[] = []
  const edges: DependencyEdge[] = []
  const nodeIds = new Set<string>()

  const ensureNode = (
    id: string,
    label: string,
    kind: DependencyNodeKind,
    detail: string | null,
  ): string => {
    if (!nodeIds.has(id)) {
      nodeIds.add(id)
      nodes.push({ id, label, kind, detail })
    }

    return id
  }

  for (const listener of listen) {
    const id = ensureNode(
      `listen:${listener.process}:${listener.port}`,
      `${listener.process}:${listener.port}`,
      'listener',
      listener.addr,
    )
    void id
  }

  for (const unit of systemd) {
    ensureNode(`svc:${slug(unit)}`, unit, 'service', 'systemd')
  }

  for (const row of docker) {
    ensureNode(`ctr:${slug(row.name)}`, row.name, 'container', row.image || row.ports)
  }

  for (const proxy of proxies) {
    const sourceId = ensureNode(`svc:${slug(proxy.source)}`, proxy.source, 'proxy', 'reverse proxy')
    const targetLabel =
      listen.find((item) => item.port === proxy.targetPort)?.process ??
      `port-${proxy.targetPort}`

    const targetId = ensureNode(
      `listen:${targetLabel}:${proxy.targetPort}`,
      `${targetLabel}:${proxy.targetPort}`,
      'listener',
      proxy.targetHost,
    )

    edges.push({
      id: `${sourceId}->${targetId}`,
      fromId: sourceId,
      toId: targetId,
      label: 'proxies',
    })
  }

  const dbPorts: Record<number, string> = {
    5432: 'postgres',
    3306: 'mysql',
    6379: 'redis',
    27017: 'mongodb',
  }

  for (const [port, name] of Object.entries(dbPorts)) {
    const portNum = Number(port)
    const dbListener = listen.find((item) => item.port === portNum)
    if (!dbListener) {
      continue
    }

    const dbId = ensureNode(`listen:${dbListener.process}:${portNum}`, `${name}:${portNum}`, 'listener', dbListener.process)

    for (const app of listen) {
      if (app.port === portNum) {
        continue
      }

      const appProc = app.process.toLowerCase()
      if (['postgres', 'mysqld', 'redis-server', 'mongod'].includes(appProc)) {
        continue
      }

      const appId = `listen:${app.process}:${app.port}`
      if (!nodeIds.has(appId)) {
        continue
      }

      edges.push({
        id: `${appId}->${dbId}-heuristic`,
        fromId: appId,
        toId: dbId,
        label: 'may-use',
      })
    }
  }

  if (listen.length === 0 && systemd.length === 0 && docker.length === 0) {
    warnings.push('Bağımlılık verisi boş; ss/docker/systemctl çıktısı alınamamış olabilir.')
  }

  const impactedByNodeId = buildImpactMap(nodes, edges)

  return {
    collectedAt: new Date().toISOString(),
    host,
    nodes,
    edges,
    impactedByNodeId,
    warnings: [...warnings],
  }
}