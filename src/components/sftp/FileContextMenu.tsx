import { useEffect, useRef } from 'react'

import type { FileEntry } from '@shared/contracts/sftp'

export type FileContextMenuAction = 'open' | 'upload' | 'download'

type FileContextMenuProps = {
  x: number
  y: number
  entries: FileEntry[]
  canUpload: boolean
  canDownload: boolean
  onAction: (action: FileContextMenuAction) => void
  onClose: () => void
}

export function FileContextMenu({
  x,
  y,
  entries,
  canUpload,
  canDownload,
  onAction,
  onClose,
}: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return
      }

      onClose()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', onClose, true)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  const transferableCount = entries.filter(
    (entry) => entry.kind === 'file' || entry.kind === 'symlink',
  ).length
  const directoryCount = entries.filter((entry) => entry.kind === 'directory').length
  const singleDirectory = entries.length === 1 && entries[0]?.kind === 'directory'

  return (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-50 min-w-44 rounded-lg border border-border bg-surface-raised py-1 shadow-xl"
      style={{ left: x, top: y }}
    >
      {singleDirectory ? (
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
          onClick={() => onAction('open')}
        >
          Aç
        </button>
      ) : null}

      {canUpload && transferableCount > 0 ? (
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
          onClick={() => onAction('upload')}
        >
          Yükle {transferableCount > 1 ? `(${transferableCount} dosya)` : ''}
        </button>
      ) : null}

      {canDownload && transferableCount > 0 ? (
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-surface-muted"
          onClick={() => onAction('download')}
        >
          İndir {transferableCount > 1 ? `(${transferableCount} dosya)` : ''}
        </button>
      ) : null}

      {entries.length === 0 ? (
        <p className="px-3 py-2 text-sm text-text-muted">İşlem yok</p>
      ) : null}

      {!singleDirectory && directoryCount > 0 && transferableCount === 0 ? (
        <p className="px-3 py-2 text-sm text-text-muted">Klasörler sürükle-bırak ile taşınamaz.</p>
      ) : null}
    </div>
  )
}
