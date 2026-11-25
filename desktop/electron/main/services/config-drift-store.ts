import Store from 'electron-store'

type StoredFingerprint = {
  path: string
  sha256: string | null
  capturedAt: string
}

type DriftStoreSchema = {
  baselines: Record<string, StoredFingerprint[]>
}

const store = new Store<DriftStoreSchema>({
  name: 'config-drift-baselines',
  defaults: { baselines: {} },
})

export const configDriftStore = {
  get(serverKey: string): StoredFingerprint[] | null {
    const list = store.get(`baselines.${serverKey}`) as StoredFingerprint[] | undefined
    return list && list.length > 0 ? list : null
  },

  save(serverKey: string, fingerprints: Array<{ path: string; sha256: string | null }>): string {
    const capturedAt = new Date().toISOString()
    const next = fingerprints.map((item) => ({
      path: item.path,
      sha256: item.sha256,
      capturedAt,
    }))
    store.set(`baselines.${serverKey}`, next)
    return capturedAt
  },

  clear(serverKey: string): void {
    const baselines = { ...(store.get('baselines') ?? {}) }
    delete baselines[serverKey]
    store.set('baselines', baselines)
  },
}