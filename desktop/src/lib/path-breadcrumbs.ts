export type PathCrumb = {
  label: string
  path: string
}

const WINDOWS_DRIVE_PATTERN = /^[A-Za-z]:/

export function isWindowsStylePath(filePath: string): boolean {
  const trimmed = filePath.trim()

  return WINDOWS_DRIVE_PATTERN.test(trimmed) || trimmed.startsWith('\\\\')
}

export function splitPathToBreadcrumbs(filePath: string): PathCrumb[] {
  const trimmed = filePath.trim()

  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('\\\\')) {
    const withoutPrefix = trimmed.slice(2)
    const parts = withoutPrefix.split(/[\\/]+/).filter(Boolean)

    if (parts.length < 2) {
      return [{ label: trimmed, path: trimmed }]
    }

    const [server, share, ...rest] = parts
    const root = `\\\\${server}\\${share}`
    const crumbs: PathCrumb[] = [
      { label: server, path: root },
      { label: share, path: root },
    ]

    let current = root
    for (const part of rest) {
      current = `${current}\\${part}`
      crumbs.push({ label: part, path: current })
    }

    return dedupeAdjacentLabels(crumbs)
  }

  const driveMatch = trimmed.match(/^([A-Za-z]:)([\\/]|$)(.*)$/)

  if (driveMatch) {
    const driveLetter = driveMatch[1]
    const root = `${driveLetter}\\`
    const rest = driveMatch[3] ?? ''
    const crumbs: PathCrumb[] = [{ label: driveLetter, path: root }]

    if (!rest) {
      return crumbs
    }

    const parts = rest.split(/[\\/]+/).filter(Boolean)
    let current = root.slice(0, -1)

    for (const part of parts) {
      current = `${current}\\${part}`
      crumbs.push({ label: part, path: current })
    }

    return crumbs
  }

  const normalized = trimmed.replace(/\\/g, '/')
  const isAbsolute = normalized.startsWith('/')

  if (isAbsolute && normalized === '/') {
    return [{ label: '/', path: '/' }]
  }

  const parts = normalized.split('/').filter(Boolean)
  const crumbs: PathCrumb[] = isAbsolute ? [{ label: '/', path: '/' }] : []
  let current = isAbsolute ? '' : ''

  for (const part of parts) {
    current = isAbsolute ? `${current}/${part}`.replace(/\/+/g, '/') : current ? `${current}/${part}` : part
    crumbs.push({ label: part, path: current })
  }

  return crumbs.length > 0 ? crumbs : [{ label: trimmed, path: trimmed }]
}

export function getParentPath(filePath: string): string {
  const crumbs = splitPathToBreadcrumbs(filePath)

  if (crumbs.length <= 1) {
    return crumbs[0]?.path ?? filePath
  }

  return crumbs[crumbs.length - 2].path
}

export function normalizeNavigatedPath(input: string, side: 'local' | 'remote'): string {
  const trimmed = input.trim()

  if (!trimmed) {
    return trimmed
  }

  if (side === 'remote') {
    const unix = trimmed.replace(/\\/g, '/')

    if (unix.startsWith('/')) {
      return unix.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
    }

    return unix
  }

  if (isWindowsStylePath(trimmed)) {
    const driveMatch = trimmed.match(/^([A-Za-z]:)([\\/]|$)(.*)$/)

    if (driveMatch) {
      const root = `${driveMatch[1]}\\`
      const rest = (driveMatch[3] ?? '').replace(/\//g, '\\').replace(/\\+/g, '\\').replace(/^\\+/, '')

      if (!rest) {
        return root
      }

      return `${driveMatch[1]}\\${rest}`.replace(/\\+/g, '\\')
    }

    return trimmed.replace(/\//g, '\\')
  }

  return trimmed.replace(/\\/g, '/')
}

function dedupeAdjacentLabels(crumbs: PathCrumb[]): PathCrumb[] {
  if (crumbs.length < 2) {
    return crumbs
  }

  const [first, second, ...rest] = crumbs

  if (first.label === second.label) {
    return [second, ...rest]
  }

  return crumbs
}