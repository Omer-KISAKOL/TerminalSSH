import { useMemo, useState } from 'react'

import type { FileEntry } from '@shared/contracts/sftp'

import {
  TRANSFER_DRAG_MIME,
  decodeTransferDragPayload,
  isTransferableEntry,
  type FilePaneSide,
  type TransferDragPayload,
} from '@/lib/file-selection'

import {
  DEFAULT_FILE_SORT,
  filterAndSortEntries,
  toggleFileSort,
  type FileSortKey,
  type FileSortState,
} from '@/lib/file-sort'

import { Button } from '@/components/ui/Button'
import { useLocale } from '@/hooks/useLocale'
import { usePathNavigationHistory } from '@/hooks/usePathNavigationHistory'
import { getParentPath } from '@/lib/paths'

import { PathBreadcrumbs } from './PathBreadcrumbs'

type FilePaneProps = {
  side: FilePaneSide
  title: string
  path: string
  entries: FileEntry[]
  selectedPaths: ReadonlySet<string>
  loading: boolean
  error: string | null
  dropActive?: boolean
  onNavigate: (path: string) => void
  onSelect: (
    entry: FileEntry,
    modifiers: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
    visibleEntries: FileEntry[],
  ) => void
  onContextMenu: (event: React.MouseEvent, entry: FileEntry | null) => void
  onDragStartTransfer: (entry: FileEntry, event: React.DragEvent) => void
  onDropTransfer: (payload: TransferDragPayload) => void
  onDragEnterPane?: () => void
  onDragLeavePane?: () => void
  onGoUp: () => void
  actionLabel?: string
  onAction?: () => void
  actionDisabled?: boolean
  listDirectoryEntries?: (directoryPath: string) => Promise<FileEntry[]>
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-accent" fill="currentColor" aria-hidden="true">
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h3.8c.6 0 1.2.3 1.6.8L12 6h6.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" />
    </svg>
  )
}

function EntryIcon({ kind }: { kind: FileEntry['kind'] }) {
  return kind === 'directory' ? <FolderIcon /> : kind === 'symlink' ? <LinkIcon /> : <FileIcon />
}

function formatDate(value: string | null, locale: 'tr' | 'en'): string {
  if (!value) {
    return '—'
  }

  return new Date(value).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function formatSize(value: number | null): string {
  if (value === null) {
    return '—'
  }

  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export function FilePane({
  side,
  title,
  path,
  entries,
  selectedPaths,
  loading,
  error,
  dropActive = false,
  onNavigate,
  onSelect,
  onContextMenu,
  onDragStartTransfer,
  onDropTransfer,
  onDragEnterPane,
  onDragLeavePane,
  onGoUp,
  actionLabel,
  onAction,
  actionDisabled = false,
  listDirectoryEntries,
}: FilePaneProps) {
  const { locale, t } = useLocale()
  const pathHistory = usePathNavigationHistory(path)
  const [dragDepth, setDragDepth] = useState(0)
  const isDropTarget = dropActive || dragDepth > 0
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<FileSortState>(DEFAULT_FILE_SORT)
  const visibleEntries = useMemo(
    () => filterAndSortEntries(entries, query, sort),
    [entries, query, sort],
  )

  const renderSortHeader = (key: FileSortKey, label: string) => {
    const active = sort.key === key

    return (
      <th
        className="truncate px-3 py-2 font-medium"
        aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        <button
          type="button"
          className="flex items-center gap-1 transition hover:text-text"
          title={t('filePane.sortBy', { column: label })}
          onClick={() => setSort((current) => toggleFileSort(current, key))}
        >
          {label}
          <span aria-hidden="true" className={active ? 'text-accent' : 'opacity-30'}>
            {active ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </button>
      </th>
    )
  }

  const handleDragEnter = (event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes(TRANSFER_DRAG_MIME)) {
      return
    }

    event.preventDefault()
    setDragDepth((current) => current + 1)
    onDragEnterPane?.()
  }

  const handleDragLeave = (event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes(TRANSFER_DRAG_MIME)) {
      return
    }

    setDragDepth((current) => Math.max(0, current - 1))
    onDragLeavePane?.()
  }

  const handleDragOver = (event: React.DragEvent) => {
    if (!event.dataTransfer.types.includes(TRANSFER_DRAG_MIME)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragDepth(0)
    onDragLeavePane?.()

    const raw = event.dataTransfer.getData(TRANSFER_DRAG_MIME)
    const payload = raw ? decodeTransferDragPayload(raw) : null

    if (!payload) {
      return
    }

    onDropTransfer(payload)
  }

  return (
    <section
      className={`flex min-h-0 min-w-0 flex-1 flex-col border bg-surface-muted transition ${
        isDropTarget ? 'border-accent ring-2 ring-accent/40' : 'border-border'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={(event) => {
        if ((event.target as HTMLElement).closest('[data-file-row]')) {
          return
        }

        event.preventDefault()
        onContextMenu(event, null)
      }}
    >
      <header className="flex flex-col gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="shrink-0 text-sm font-medium text-text">{title}</h3>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              className="px-2 py-1 text-xs"
              onClick={() => {
                const parent = getParentPath(path)

                if (parent !== path) {
                  onNavigate(parent)
                } else {
                  onGoUp()
                }
              }}
            >
              {t('filePane.parentDir')}
            </Button>
          {actionLabel && onAction ? (
            <Button
              variant="primary"
              className="px-2 py-1 text-xs"
              disabled={actionDisabled}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          ) : null}
          </div>
        </div>
        <PathBreadcrumbs
          side={side}
          path={path}
          listDirectoryEntries={listDirectoryEntries}
          onNavigate={onNavigate}
          canGoBack={pathHistory.canGoBack}
          canGoForward={pathHistory.canGoForward}
          onGoBack={() => {
            const target = pathHistory.goBack()

            if (target) {
              onNavigate(target)
            }
          }}
          onGoForward={() => {
            const target = pathHistory.goForward()

            if (target) {
              onNavigate(target)
            }
          }}
        />
      </header>

      {error ? (
        <p className="border-b border-status-error/30 bg-status-error/10 px-3 py-2 text-sm text-status-error">
          {error}
        </p>
      ) : null}

      {isDropTarget ? (
        <p className="border-b border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          {side === 'local' ? t('sftp.dropDownload') : t('sftp.dropUpload')}
        </p>
      ) : null}

      <div className="border-b border-border px-3 py-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('filePane.searchPlaceholder')}
          aria-label={t('filePane.searchPlaceholder')}
          className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[42%]" />
            <col className="w-[24%]" />
            <col className="w-[14%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead className="sticky top-0 z-1 bg-surface-raised text-xs text-text-muted">
            <tr>
              {renderSortHeader('name', t('filePane.name'))}
              {renderSortHeader('modified', t('filePane.modified'))}
              {renderSortHeader('size', t('filePane.size'))}
              {renderSortHeader('type', t('filePane.type'))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-text-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : visibleEntries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-text-muted">
                  {entries.length === 0 ? t('filePane.emptyDir') : t('filePane.noResults')}
                </td>
              </tr>
            ) : (
              visibleEntries.map((entry) => {
                const isSelected = selectedPaths.has(entry.path)
                const draggable = isTransferableEntry(entry)

                return (
                  <tr
                    key={entry.path}
                    data-file-row
                    draggable={draggable}
                    className={`cursor-pointer border-t border-border/60 transition hover:bg-surface ${
                      isSelected ? 'bg-accent/10' : ''
                    } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                    onClick={(event) =>
                      onSelect(entry, {
                        ctrlKey: event.ctrlKey,
                        metaKey: event.metaKey,
                        shiftKey: event.shiftKey,
                      }, visibleEntries)
                    }
                    onDoubleClick={() => {
                      if (entry.kind === 'directory') {
                        onNavigate(entry.path)
                      }
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      onContextMenu(event, entry)
                    }}
                    onDragStart={(event) => {
                      if (!draggable) {
                        event.preventDefault()
                        return
                      }

                      onDragStartTransfer(entry, event)
                    }}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <EntryIcon kind={entry.kind} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-text">{entry.name}</div>
                          {entry.permissions ? (
                            <div className="font-mono text-[11px] text-text-muted">{entry.permissions}</div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="truncate px-3 py-2 text-text-muted">
                      {formatDate(entry.modifiedAt, locale)}
                    </td>
                    <td className="truncate px-3 py-2 text-text-muted">{formatSize(entry.size)}</td>
                    <td className="truncate px-3 py-2 text-text-muted">
                      {entry.kind === 'directory'
                        ? t('filePane.kindFolder')
                        : entry.kind === 'symlink'
                          ? t('filePane.kindSymlink')
                          : t('filePane.kindFile')}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
