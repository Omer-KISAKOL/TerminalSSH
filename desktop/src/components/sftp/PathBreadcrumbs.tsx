import { useEffect, useMemo, useRef, useState } from 'react'

import type { FileEntry } from '@shared/contracts/sftp'

import { useLocale } from '@/hooks/useLocale'
import { applyPathTabCompletion, getPathCompletionContext } from '@/lib/path-completion'
import { splitPathToBreadcrumbs, normalizeNavigatedPath } from '@/lib/path-breadcrumbs'
import type { FilePaneSide } from '@/lib/file-selection'

type PathBreadcrumbsProps = {
  side: FilePaneSide
  path: string
  onNavigate: (path: string) => void
  onGoBack?: () => void
  onGoForward?: () => void
  canGoBack?: boolean
  canGoForward?: boolean
  listDirectoryEntries?: (directoryPath: string) => Promise<FileEntry[]>
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 text-text-muted" aria-hidden="true">
      <path fill="currentColor" d="M9 6.5 14.5 12 9 17.5 7.5 16l4-4-4-4z" />
    </svg>
  )
}

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition hover:bg-surface hover:text-text disabled:cursor-not-allowed disabled:opacity-35"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function PathBreadcrumbs({
  side,
  path,
  onNavigate,
  onGoBack,
  onGoForward,
  canGoBack = false,
  canGoForward = false,
  listDirectoryEntries,
}: PathBreadcrumbsProps) {
  const { t } = useLocale()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(path)
  const inputRef = useRef<HTMLInputElement>(null)
  const tabCycleRef = useRef({ draft: '', index: 0 })

  const crumbs = useMemo(() => splitPathToBreadcrumbs(path), [path])

  useEffect(() => {
    if (!editing) {
      setDraft(path)
    }
  }, [editing, path])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commitDraft = () => {
    const next = normalizeNavigatedPath(draft, side === 'local' ? 'local' : 'remote')

    setEditing(false)

    if (next && next !== path) {
      onNavigate(next)
    }
  }

  const completeWithTab = async () => {
    if (!listDirectoryEntries) {
      return
    }

    const contextSide = side === 'local' ? 'local' : 'remote'
    const { parentPath } = getPathCompletionContext(draft, contextSide)

    let entries: FileEntry[] = []

    try {
      entries = await listDirectoryEntries(parentPath)
    } catch {
      return
    }

    const cycleKey = `${parentPath}:${draft}`
    let cycleIndex = 0

    if (tabCycleRef.current.draft === cycleKey) {
      cycleIndex = tabCycleRef.current.index + 1
    }

    const { nextDraft, matchCount } = applyPathTabCompletion(draft, contextSide, entries, cycleIndex)

    tabCycleRef.current = {
      draft: cycleKey,
      index: matchCount > 1 ? cycleIndex : 0,
    }

    if (nextDraft !== draft) {
      setDraft(nextDraft)
    }
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-0.5">
      <NavButton label={t('filePane.goBack')} disabled={!canGoBack} onClick={onGoBack}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </NavButton>
      <NavButton label={t('filePane.goForward')} disabled={!canGoForward} onClick={onGoForward}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </NavButton>

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            tabCycleRef.current = { draft: '', index: 0 }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Tab') {
              event.preventDefault()
              void completeWithTab()
              return
            }

            if (event.key === 'Enter') {
              event.preventDefault()
              commitDraft()
            }

            if (event.key === 'Escape') {
              event.preventDefault()
              setDraft(path)
              setEditing(false)
            }
          }}
          onBlur={commitDraft}
          className="min-w-0 flex-1 rounded-md border border-accent bg-surface px-2 py-1 font-mono text-xs text-text focus:outline-none"
          aria-label={t('filePane.pathInputLabel')}
          title={t('filePane.pathTabHint')}
          placeholder={t('filePane.pathTabHint')}
        />
      ) : (
        <nav
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-md border border-transparent px-1 py-0.5 scrollbar-thin"
          aria-label={t('filePane.pathBreadcrumb')}
        >
          {crumbs.length === 0 ? (
            <button
              type="button"
              className="truncate rounded px-1.5 py-0.5 font-mono text-xs text-text-muted hover:bg-surface"
              onClick={() => setEditing(true)}
            >
              —
            </button>
          ) : (
            crumbs.map((crumb, index) => (
              <span key={`${crumb.path}-${index}`} className="flex shrink-0 items-center gap-0.5">
                {index > 0 ? <ChevronRight /> : null}
                <button
                  type="button"
                  className="max-w-48 truncate rounded px-1.5 py-0.5 font-mono text-xs text-text transition hover:bg-surface hover:text-accent"
                  title={crumb.path}
                  onClick={() => onNavigate(crumb.path)}
                  onDoubleClick={(event) => {
                    event.preventDefault()
                    setEditing(true)
                  }}
                >
                  {crumb.label}
                </button>
              </span>
            ))
          )}
          {crumbs.length > 0 ? (
            <button
              type="button"
              className="ml-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-muted hover:bg-surface hover:text-text"
              onClick={() => setEditing(true)}
            >
              {t('filePane.editPath')}
            </button>
          ) : null}
        </nav>
      )}
    </div>
  )
}