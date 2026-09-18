import { useEffect, useRef } from 'react'

type TerminalContextMenuProps = {
  x: number
  y: number
  onCopy: () => void
  onPaste: () => void
  onClear: () => void
  onClose: () => void
}

export function TerminalContextMenu({
  x,
  y,
  onCopy,
  onPaste,
  onClear,
  onClose,
}: TerminalContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    menuRef.current?.focus()
  }, [])

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      aria-label="Terminal menüsü"
      className="fixed z-50 min-w-40 rounded-lg border border-border bg-surface-raised py-1 shadow-xl focus:outline-none"
      style={{ left: x, top: y }}
    >
      <button
        type="button"
        role="menuitem"
        className="block w-full px-4 py-2 text-left text-sm text-text transition hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
        onClick={() => {
          onCopy()
          onClose()
        }}
      >
        Kopyala
      </button>
      <button
        type="button"
        role="menuitem"
        className="block w-full px-4 py-2 text-left text-sm text-text transition hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
        onClick={() => {
          void onPaste()
          onClose()
        }}
      >
        Yapıştır
      </button>
      <button
        type="button"
        role="menuitem"
        className="block w-full px-4 py-2 text-left text-sm text-text transition hover:bg-surface-muted focus-visible:bg-surface-muted focus-visible:outline-none"
        onClick={() => {
          onClear()
          onClose()
        }}
      >
        Temizle
      </button>
    </div>
  )
}
