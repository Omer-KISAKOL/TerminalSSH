export function getParentPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  const index = normalized.lastIndexOf('/')

  if (index <= 0) {
    return '/'
  }

  return normalized.slice(0, index) || '/'
}

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
