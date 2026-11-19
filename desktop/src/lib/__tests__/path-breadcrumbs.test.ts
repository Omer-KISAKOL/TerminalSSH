import { describe, expect, it } from 'vitest'

import { getParentPath, normalizeNavigatedPath, splitPathToBreadcrumbs } from '../path-breadcrumbs'

describe('splitPathToBreadcrumbs', () => {
  it('splits Windows paths with drive root', () => {
    expect(splitPathToBreadcrumbs('C:\\htdocs\\findmare-web')).toEqual([
      { label: 'C:', path: 'C:\\' },
      { label: 'htdocs', path: 'C:\\htdocs' },
      { label: 'findmare-web', path: 'C:\\htdocs\\findmare-web' },
    ])
  })

  it('splits unix remote paths', () => {
    expect(splitPathToBreadcrumbs('/var/www/html')).toEqual([
      { label: '/', path: '/' },
      { label: 'var', path: '/var' },
      { label: 'www', path: '/var/www' },
      { label: 'html', path: '/var/www/html' },
    ])
  })
})

describe('getParentPath', () => {
  it('returns drive root parent on Windows', () => {
    expect(getParentPath('C:\\htdocs')).toBe('C:\\')
    expect(getParentPath('C:\\')).toBe('C:\\')
  })

  it('returns unix parent', () => {
    expect(getParentPath('/var/www')).toBe('/var')
    expect(getParentPath('/')).toBe('/')
  })
})

describe('normalizeNavigatedPath', () => {
  it('normalizes typed Windows paths', () => {
    expect(normalizeNavigatedPath('C:/htdocs', 'local')).toBe('C:\\htdocs')
    expect(normalizeNavigatedPath('c:', 'local')).toBe('c:\\')
  })
})