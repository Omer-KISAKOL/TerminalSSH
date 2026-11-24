import { randomUUID } from 'node:crypto'

import Store from 'electron-store'

import { OPERATIONAL_TIMELINE_RETENTION_MS } from '@shared/constants/timeline'
import type {
  OperationalTimelineEvent,
  OperationalTimelineEventType,
} from '@shared/contracts/server-ops'

interface TimelineStoreSchema {
  events: OperationalTimelineEvent[]
}

export function buildServerKey(input: {
  host: string
  port: number
  username: string
  profileId?: string | null
}): string {
  if (input.profileId) {
    return `profile:${input.profileId}`
  }

  return `host:${input.host}:${input.port}:${input.username}`
}

function retentionCutoffIso(): string {
  return new Date(Date.now() - OPERATIONAL_TIMELINE_RETENTION_MS).toISOString()
}

export class OperationalTimelineStore {
  private readonly store = new Store<TimelineStoreSchema>({
    name: 'terminalssh-operational-timeline',
    defaults: {
      events: [],
    },
  })

  /** Süresi dolan kayıtları diskten kaldırır; kalan olay sayısını döner. */
  purgeExpired(): number {
    const cutoff = retentionCutoffIso()
    const events = this.store.get('events')
    const kept = events.filter((event) => event.createdAt >= cutoff)

    if (kept.length !== events.length) {
      this.store.set('events', kept)
    }

    return kept.length
  }

  append(input: {
    serverKey: string
    host: string
    profileId?: string | null
    profileName?: string | null
    type: OperationalTimelineEventType
    summary: string
    detail?: string | null
  }): OperationalTimelineEvent {
    const event: OperationalTimelineEvent = {
      id: randomUUID(),
      serverKey: input.serverKey,
      host: input.host,
      profileId: input.profileId ?? null,
      profileName: input.profileName ?? null,
      type: input.type,
      summary: input.summary,
      detail: input.detail?.trim() ? input.detail.trim() : null,
      createdAt: new Date().toISOString(),
    }

    const cutoff = retentionCutoffIso()
    const next = [...this.store.get('events').filter((item) => item.createdAt >= cutoff), event]
    this.store.set('events', next)
    return event
  }

  list(serverKey: string, limit = 80): OperationalTimelineEvent[] {
    this.purgeExpired()

    const cutoff = retentionCutoffIso()
    const events = this.store
      .get('events')
      .filter((event) => event.serverKey === serverKey && event.createdAt >= cutoff)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

    return events.slice(0, limit)
  }
}

export const operationalTimelineStore = new OperationalTimelineStore()