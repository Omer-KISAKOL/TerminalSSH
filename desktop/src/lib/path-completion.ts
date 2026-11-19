import type { FileEntry } from '@shared/contracts/sftp'

import { isWindowsStylePath, normalizeNavigatedPath } from './path-breadcrumbs'

export type PathCompletionSide = 'local' | 'remote'

export type PathCompletionContext = {
  parentPath: string
  partial: string
}

export function getPathCompletionContext(draft: string, side: PathCompletionSide): PathCompletionContext {
  const trimmed = draft.trim()

  if (!trimmed) {
    return {
      parentPath: side === 'local' ? 'C:\\' : '/',
      partial: '',
    }
  }

  const windows = side === 'local' && isWindowsStylePath(trimmed)
  const trailingSep = /[\\/]$/.test(trimmed)

  if (trailingSep) {
    return {
      parentPath: normalizeNavigatedPath(trimmed, side),
      partial: '',
    }
  }

  const lastSep = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))

  if (lastSep === -1) {
    if (windows && /^[A-Za-z]:$/.test(trimmed)) {
      return {
        parentPath: `${trimmed}\\`,
        partial: '',
      }
    }

    return {
      parentPath: windows ? 'C:\\' : '/',
      partial: trimmed,
    }
  }

  const parentRaw = trimmed.slice(0, lastSep + 1)
  const partial = trimmed.slice(lastSep + 1)

  let parentPath = normalizeNavigatedPath(parentRaw, side)

  if (windows && /^[A-Za-z]:$/.test(parentRaw.replace(/[\\/]+$/, ''))) {
    parentPath = `${parentRaw.replace(/[\\/]+$/, '')}\\`
  }

  return { parentPath, partial }
}

function longestCommonPrefix(values: string[], caseInsensitive: boolean): string {
  if (values.length === 0) {
    return ''
  }

  let prefix = values[0]

  for (const value of values.slice(1)) {
    const left = caseInsensitive ? prefix.toLowerCase() : prefix
    const right = caseInsensitive ? value.toLowerCase() : value
    let index = 0

    while (index < prefix.length && index < value.length && left[index] === right[index]) {
      index += 1
    }

    prefix = prefix.slice(0, index)

    if (!prefix) {
      break
    }
  }

  return prefix
}

function joinCompletedSegment(
  parentPath: string,
  name: string,
  isDirectory: boolean,
  side: PathCompletionSide,
): string {
  const windows = side === 'local' && isWindowsStylePath(parentPath)
  const separator = windows ? '\\' : '/'
  const base = parentPath.endsWith(separator) || parentPath.endsWith('/')
    ? parentPath
    : `${parentPath}${separator}`
  const joined = `${base}${name}`

  if (isDirectory) {
    return normalizeNavigatedPath(`${joined}${separator}`, side)
  }

  return normalizeNavigatedPath(joined, side)
}

export function applyPathTabCompletion(
  draft: string,
  side: PathCompletionSide,
  entries: FileEntry[],
  cycleIndex = 0,
): { nextDraft: string; matchCount: number } {
  const { parentPath, partial } = getPathCompletionContext(draft, side)
  const needle = partial.toLowerCase()

  const matches = entries
    .filter((entry) => entry.name.toLowerCase().startsWith(needle))
    .sort((left, right) => left.name.localeCompare(right.name, 'tr'))

  if (matches.length === 0) {
    return { nextDraft: draft, matchCount: 0 }
  }

  if (matches.length === 1) {
    const match = matches[0]
    return {
      nextDraft: joinCompletedSegment(parentPath, match.name, match.kind === 'directory', side),
      matchCount: 1,
    }
  }

  const common = longestCommonPrefix(
    matches.map((match) => match.name),
    true,
  )

  if (common.length > partial.length) {
    return {
      nextDraft: joinCompletedSegment(
        parentPath,
        common,
        false,
        side,
      ),
      matchCount: matches.length,
    }
  }

  const picked = matches[cycleIndex % matches.length]

  if (!picked) {
    return { nextDraft: draft, matchCount: matches.length }
  }

  return {
    nextDraft: joinCompletedSegment(parentPath, picked.name, picked.kind === 'directory', side),
    matchCount: matches.length,
  }
}