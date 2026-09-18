import { useState } from 'react'

import type { FileEntry } from '@shared/contracts/sftp'

import {
  TRANSFER_DRAG_MIME,
  decodeTransferDragPayload,
  isTransferableEntry,
  type FilePaneSide,
  type TransferDragPayload,
} from '@/lib/file-selection'

import { Button } from '@/components/ui/Button'

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
}

function formatDate(value: string | null): string {
  if (!value) {
    return '—'
  }

  return new Date(value).toLocaleString('tr-TR', {
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
}: FilePaneProps) {
  const [dragDepth, setDragDepth] = useState(0)
  const isDropTarget = dropActive || dragDepth > 0

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
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-text">{title}</h3>
          <p className="truncate font-mono text-xs text-text-muted">{path || '—'}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onGoUp}>
            Üst dizin
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
      </header>

      {error ? (
        <p className="border-b border-status-error/30 bg-status-error/10 px-3 py-2 text-sm text-status-error">
          {error}
        </p>
      ) : null}

      {isDropTarget ? (
        <p className="border-b border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          {side === 'local' ? 'Dosyaları buraya bırakarak indirin' : 'Dosyaları buraya bırakarak yükleyin'}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-surface-raised text-xs text-text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Ad</th>
              <th className="px-3 py-2 font-medium">Değiştirilme</th>
              <th className="px-3 py-2 font-medium">Boyut</th>
              <th className="px-3 py-2 font-medium">Tür</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-text-muted">
                  Yükleniyor…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-text-muted">
                  Bu dizin boş.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
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
                      })
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
                      <div className="font-medium text-text">{entry.name}</div>
                      {entry.permissions ? (
                        <div className="font-mono text-[11px] text-text-muted">{entry.permissions}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-text-muted">{formatDate(entry.modifiedAt)}</td>
                    <td className="px-3 py-2 text-text-muted">{formatSize(entry.size)}</td>
                    <td className="px-3 py-2 text-text-muted">
                      {entry.kind === 'directory'
                        ? 'klasör'
                        : entry.kind === 'symlink'
                          ? 'bağlantı'
                          : 'dosya'}
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
