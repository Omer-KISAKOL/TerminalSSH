import type { FileEntry } from '@shared/contracts/sftp'

export type FilePaneSide = 'local' | 'remote'

export interface TransferDragPayload {
  sourcePane: FilePaneSide
  paths: string[]
}

export const TRANSFER_DRAG_MIME = 'application/x-terminalssh-transfer'

export function isTransferableEntry(entry: FileEntry): boolean {
  return entry.kind === 'file' || entry.kind === 'symlink'
}

export function getTransferableEntries(
  entries: FileEntry[],
  selectedPaths: ReadonlySet<string>,
): FileEntry[] {
  return entries.filter((entry) => selectedPaths.has(entry.path) && isTransferableEntry(entry))
}

export function selectEntry(
  entries: FileEntry[],
  entry: FileEntry,
  selectedPaths: ReadonlySet<string>,
  anchorPath: string | null,
  modifiers: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
): { selectedPaths: Set<string>; anchorPath: string } {
  const multiModifier = modifiers.ctrlKey || modifiers.metaKey

  if (modifiers.shiftKey && anchorPath) {
    const anchorIndex = entries.findIndex((item) => item.path === anchorPath)
    const targetIndex = entries.findIndex((item) => item.path === entry.path)

    if (anchorIndex >= 0 && targetIndex >= 0) {
      const start = Math.min(anchorIndex, targetIndex)
      const end = Math.max(anchorIndex, targetIndex)
      const rangePaths = entries.slice(start, end + 1).map((item) => item.path)

      return {
        selectedPaths: new Set(rangePaths),
        anchorPath,
      }
    }
  }

  if (multiModifier) {
    const next = new Set(selectedPaths)

    if (next.has(entry.path)) {
      next.delete(entry.path)
    } else {
      next.add(entry.path)
    }

    return {
      selectedPaths: next,
      anchorPath: entry.path,
    }
  }

  return {
    selectedPaths: new Set([entry.path]),
    anchorPath: entry.path,
  }
}

export function encodeTransferDragPayload(payload: TransferDragPayload): string {
  return JSON.stringify(payload)
}

export function decodeTransferDragPayload(raw: string): TransferDragPayload | null {
  try {
    const parsed = JSON.parse(raw) as TransferDragPayload

    if (
      (parsed.sourcePane !== 'local' && parsed.sourcePane !== 'remote') ||
      !Array.isArray(parsed.paths) ||
      parsed.paths.some((path) => typeof path !== 'string')
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}
