export interface ProcessTreeNode {
  pid: number
  ppid: number
  cpuPercent: number
  memPercent: number
  rssKb: number
  command: string
  children: ProcessTreeNode[]
}

export interface ProcessExplorerSnapshot {
  collectedAt: string
  host: string
  roots: ProcessTreeNode[]
  flatCount: number
  warnings: string[]
}

import { extractOpsSection } from './section'

function toNumber(value: string): number {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

export function parseFlatProcessLines(sectionText: string): Omit<ProcessTreeNode, 'children'>[] {
  const rows: Omit<ProcessTreeNode, 'children'>[] = []

  for (const line of sectionText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const match = trimmed.match(/^(\d+)\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)\s+(\d+)\s*(.+)$/)
    if (!match) {
      continue
    }

    rows.push({
      pid: Number(match[1]),
      ppid: Number(match[2]),
      cpuPercent: toNumber(match[3]),
      memPercent: toNumber(match[4]),
      rssKb: Number(match[5]),
      command: match[6].trim(),
    })
  }

  return rows
}

export function buildProcessTree(flat: Omit<ProcessTreeNode, 'children'>[]): ProcessTreeNode[] {
  const byPid = new Map<number, ProcessTreeNode>()

  for (const row of flat) {
    byPid.set(row.pid, { ...row, children: [] })
  }

  const roots: ProcessTreeNode[] = []

  for (const node of byPid.values()) {
    const parent = byPid.get(node.ppid)
    if (parent && parent.pid !== node.pid) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortTree = (nodes: ProcessTreeNode[]) => {
    nodes.sort((a, b) => b.cpuPercent - a.cpuPercent || a.pid - b.pid)
    for (const child of nodes) {
      sortTree(child.children)
    }
  }

  sortTree(roots)
  return roots
}

export function processExplorerHasPayload(snapshot: ProcessExplorerSnapshot): boolean {
  return snapshot.flatCount > 0
}

export function parseProcessExplorerOutput(
  host: string,
  raw: string,
  warnings: string[] = [],
): ProcessExplorerSnapshot {
  const sectionText = extractOpsSection(raw, 'PROCESSES')
  const flat = parseFlatProcessLines(sectionText)
  const roots = buildProcessTree(flat)

  if (flat.length === 0) {
    warnings.push('İşlem listesi boş; ps komutu çalışmamış veya yetki yetersiz olabilir.')
  }

  return {
    collectedAt: new Date().toISOString(),
    host,
    roots,
    flatCount: flat.length,
    warnings: [...warnings],
  }
}