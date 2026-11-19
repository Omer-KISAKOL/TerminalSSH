export { getParentPath, splitPathToBreadcrumbs, normalizeNavigatedPath } from '@/lib/path-breadcrumbs'

export function joinPath(base: string, name: string): string {
  if (base.endsWith('/')) {
    return `${base}${name}`
  }

  return `${base}/${name}`
}

export function joinLocalPath(base: string, name: string): string {
  if (base.endsWith('/')) {
    return `${base}${name}`
  }

  return `${base}/${name}`
}
