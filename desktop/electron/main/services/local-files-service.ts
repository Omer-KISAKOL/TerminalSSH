import { homedir } from 'node:os'
import path from 'node:path'
import { readdir, stat } from 'node:fs/promises'

import type { FileEntry, FileEntryKind } from '@shared/contracts/sftp'

function resolveSafePath(inputPath: string): string {
  const resolved = path.resolve(inputPath)

  if (!path.isAbsolute(resolved)) {
    throw new Error('Geçersiz dosya yolu.')
  }

  return resolved
}

function formatPermissions(mode: number): string {
  const types = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx']
  const owner = types[(mode >> 6) & 7] ?? '---'
  const group = types[(mode >> 3) & 7] ?? '---'
  const other = types[mode & 7] ?? '---'
  const prefix = (mode & 0o40000) !== 0 ? 'd' : (mode & 0o120000) !== 0 ? 'l' : '-'

  return `${prefix}${owner}${group}${other}`
}

function toKind(mode: number): FileEntryKind {
  if ((mode & 0o40000) !== 0) {
    return 'directory'
  }

  if ((mode & 0o120000) !== 0) {
    return 'symlink'
  }

  return 'file'
}

export class LocalFilesService {
  getHomeDirectory(): string {
    return homedir()
  }

  async listDirectory(inputPath: string): Promise<FileEntry[]> {
    const directoryPath = resolveSafePath(inputPath)
    const entries = await readdir(directoryPath, { withFileTypes: true })
    const results: FileEntry[] = []

    for (const entry of entries) {
      const entryPath = path.join(directoryPath, entry.name)

      try {
        const stats = await stat(entryPath)
        results.push({
          name: entry.name,
          path: entryPath,
          kind: toKind(stats.mode),
          size: stats.isFile() ? stats.size : null,
          modifiedAt: stats.mtime.toISOString(),
          permissions: formatPermissions(stats.mode & 0o777),
        })
      } catch {
        continue
      }
    }

    return results.sort((left, right) => {
      if (left.kind === 'directory' && right.kind !== 'directory') {
        return -1
      }

      if (left.kind !== 'directory' && right.kind === 'directory') {
        return 1
      }

      return left.name.localeCompare(right.name, 'tr')
    })
  }
}

export const localFilesService = new LocalFilesService()
