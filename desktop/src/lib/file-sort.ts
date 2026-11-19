import type { FileEntry } from '@shared/contracts/sftp'

export type FileSortKey = 'name' | 'modified' | 'size' | 'type'
export type FileSortDirection = 'asc' | 'desc'

export type FileSortState = {
  key: FileSortKey
  direction: FileSortDirection
}

export const DEFAULT_FILE_SORT: FileSortState = { key: 'name', direction: 'asc' }

const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function kindRank(entry: FileEntry): number {
  return entry.kind === 'directory' ? 0 : entry.kind === 'symlink' ? 1 : 2
}

function compareBy(a: FileEntry, b: FileEntry, key: FileSortKey): number {
  switch (key) {
    case 'name':
      return nameCollator.compare(a.name, b.name)
    case 'modified':
      return (a.modifiedAt ? Date.parse(a.modifiedAt) : 0) - (b.modifiedAt ? Date.parse(b.modifiedAt) : 0)
    case 'size':
      return (a.size ?? -1) - (b.size ?? -1)
    case 'type':
      return kindRank(a) - kindRank(b)
  }
}

export function toggleFileSort(current: FileSortState, key: FileSortKey): FileSortState {
  if (current.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  }

  return { key, direction: 'asc' }
}

export function filterAndSortEntries(
  entries: readonly FileEntry[],
  query: string,
  sort: FileSortState,
): FileEntry[] {
  const needle = query.trim().toLowerCase()
  const filtered = needle
    ? entries.filter((entry) => entry.name.toLowerCase().includes(needle))
    : [...entries]
  const factor = sort.direction === 'asc' ? 1 : -1

  return filtered.sort((a, b) => {
    // Klasörler ad sıralamasında her zaman üstte kalır.
    if (sort.key !== 'type') {
      const rank = (a.kind === 'directory' ? 0 : 1) - (b.kind === 'directory' ? 0 : 1)

      if (rank !== 0) {
        return rank
      }
    }

    const primary = compareBy(a, b, sort.key) * factor

    return primary !== 0 ? primary : nameCollator.compare(a.name, b.name)
  })
}
