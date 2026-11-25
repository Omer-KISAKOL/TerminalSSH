import { extractOpsSection } from './section'

export interface IncidentSignal {
  id: string
  category: 'service' | 'resource' | 'command' | 'journal'
  severity: 'high' | 'medium' | 'low'
  summary: string
  detail: string | null
  at: string | null
}

export interface IncidentAnalyzerSnapshot {
  collectedAt: string
  host: string
  windowLabel: string
  signals: IncidentSignal[]
  likelyCauses: string[]
  warnings: string[]
}

export function parseIncidentJournalSection(sectionText: string): IncidentSignal[] {
  const signals: IncidentSignal[] = []
  let index = 0

  for (const line of sectionText.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    const lower = trimmed.toLowerCase()
    const severity: IncidentSignal['severity'] =
      lower.includes('fatal') || lower.includes('critical') || lower.includes('failed')
        ? 'high'
        : lower.includes('error') || lower.includes('denied')
          ? 'medium'
          : 'low'

    signals.push({
      id: `journal-${index++}`,
      category: 'journal',
      severity,
      summary: trimmed.slice(0, 120),
      detail: trimmed.length > 120 ? trimmed : null,
      at: null,
    })
  }

  return signals.slice(0, 20)
}

export function parseIncidentResourceSection(sectionText: string): IncidentSignal[] {
  const line = sectionText.split('\n').map((item) => item.trim()).find(Boolean)
  if (!line) {
    return []
  }

  const loadMatch = line.match(/load average[s]?:\s*(.+)$/i)
  const severity: IncidentSignal['severity'] = loadMatch && /[3-9]\./.test(loadMatch[1]) ? 'high' : 'medium'

  return [
    {
      id: 'resource-load',
      category: 'resource',
      severity,
      summary: 'Kaynak kullanımı',
      detail: line,
      at: null,
    },
  ]
}

export function buildIncidentAnalyzerSnapshot(input: {
  host: string
  raw: string
  timelineSummaries: Array<{ summary: string; detail: string | null; createdAt: string; type: string }>
  warnings?: string[]
}): IncidentAnalyzerSnapshot {
  const warnings = [...(input.warnings ?? [])]
  const signals: IncidentSignal[] = []

  signals.push(...parseIncidentJournalSection(extractOpsSection(input.raw, 'JOURNAL_ERRORS')))
  signals.push(...parseIncidentResourceSection(extractOpsSection(input.raw, 'RESOURCE')))

  for (const [index, event] of input.timelineSummaries.entries()) {
    signals.push({
      id: `timeline-${index}`,
      category: event.type === 'command' ? 'command' : 'service',
      severity: event.summary.toLowerCase().includes('hata') ? 'high' : 'low',
      summary: event.summary,
      detail: event.detail,
      at: event.createdAt,
    })
  }

  const likelyCauses: string[] = []
  const high = signals.filter((signal) => signal.severity === 'high')
  if (high.some((signal) => signal.category === 'journal')) {
    likelyCauses.push('Sistem günlüğünde yüksek öncelikli hata kayıtları var.')
  }
  if (high.some((signal) => signal.category === 'resource')) {
    likelyCauses.push('CPU/ yük ortalaması yükselmiş olabilir.')
  }
  if (signals.some((signal) => signal.category === 'command')) {
    likelyCauses.push('Terminal geçmişinde ilgili zaman aralığında komut aktivitesi bulundu.')
  }
  if (likelyCauses.length === 0) {
    likelyCauses.push('Belirgin tek bir kök neden çıkarılamadı; sinyalleri birlikte inceleyin.')
  }

  return {
    collectedAt: new Date().toISOString(),
    host: input.host,
    windowLabel: 'Son ~3 saat',
    signals: signals.slice(0, 35),
    likelyCauses,
    warnings,
  }
}

export function incidentAnalyzerHasPayload(snapshot: IncidentAnalyzerSnapshot): boolean {
  return snapshot.signals.length > 0
}