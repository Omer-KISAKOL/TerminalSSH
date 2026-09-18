import Store from 'electron-store'

import type { KnownHostRecord } from '@shared/contracts/host'

import { makeHostKey } from './fingerprint'

interface KnownHostsSchema {
  hosts: Record<string, KnownHostRecord>
}

export class KnownHostsStore {
  private readonly store = new Store<KnownHostsSchema>({
    name: 'terminalssh-known-hosts',
    defaults: {
      hosts: {},
    },
  })

  get(host: string, port: number): KnownHostRecord | null {
    const key = makeHostKey(host, port)
    return this.store.get('hosts')[key] ?? null
  }

  save(host: string, port: number, fingerprint: string): KnownHostRecord {
    const key = makeHostKey(host, port)
    const record: KnownHostRecord = {
      fingerprint,
      addedAt: new Date().toISOString(),
    }

    this.store.set('hosts', {
      ...this.store.get('hosts'),
      [key]: record,
    })

    return record
  }

  remove(host: string, port: number): void {
    const key = makeHostKey(host, port)
    const hosts = { ...this.store.get('hosts') }
    delete hosts[key]
    this.store.set('hosts', hosts)
  }
}

export const knownHostsStore = new KnownHostsStore()
