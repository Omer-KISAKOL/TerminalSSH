import { describe, expect, it } from 'vitest'

import type { FileEntry } from '@shared/contracts/sftp'

import { applyPathTabCompletion, getPathCompletionContext } from '../path-completion'

const entries: FileEntry[] = [
  { name: 'backend', path: '/var/www/backend', kind: 'directory', size: null, modifiedAt: null, permissions: null },
  { name: 'html', path: '/var/www/html', kind: 'directory', size: null, modifiedAt: null, permissions: null },
  { name: 'notes.txt', path: '/var/www/notes.txt', kind: 'file', size: 10, modifiedAt: null, permissions: null },
]

describe('getPathCompletionContext', () => {
  it('splits unix partial path', () => {
    expect(getPathCompletionContext('/var/ww', 'remote')).toEqual({
      parentPath: '/var',
      partial: 'ww',
    })
  })

  it('treats trailing separator as empty partial', () => {
    expect(getPathCompletionContext('C:\\Users\\', 'local').partial).toBe('')
  })
})

describe('applyPathTabCompletion', () => {
  it('completes unique directory match', () => {
    const result = applyPathTabCompletion('/var/htm', 'remote', entries)

    expect(result.nextDraft).toBe('/var/html')
    expect(result.matchCount).toBe(1)
  })

  it('extends common prefix for multiple matches', () => {
    const dual: FileEntry[] = [
      {
        name: 'backend-api',
        path: '/var/backend-api',
        kind: 'directory',
        size: null,
        modifiedAt: null,
        permissions: null,
      },
      {
        name: 'backend-web',
        path: '/var/backend-web',
        kind: 'directory',
        size: null,
        modifiedAt: null,
        permissions: null,
      },
    ]
    const result = applyPathTabCompletion('/var/back', 'remote', dual)

    expect(result.nextDraft).toBe('/var/backend-')
    expect(result.matchCount).toBe(2)
  })
})