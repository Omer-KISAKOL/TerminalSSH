import '@xterm/xterm/css/xterm.css'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useTerminal } from '@/hooks/useTerminal'

import { TerminalContextMenu } from './TerminalContextMenu'

export type TerminalApi = {
  write: (data: string) => void
  writeln: (message: string) => void
  clear: () => void
  focus: () => void
}

type TerminalViewProps = {
  onReady: (api: TerminalApi | null) => void
  onInput: (data: string) => void
  onResize: (cols: number, rows: number) => void
}

type ContextMenuState = {
  x: number
  y: number
}

export function TerminalView({ onReady, onInput, onResize }: TerminalViewProps) {
  const terminal = useTerminal({ onInput, onResize })
  const apiRef = useRef<TerminalApi | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  useEffect(() => {
    const api: TerminalApi = {
      write: terminal.write,
      writeln: terminal.writeln,
      clear: terminal.clear,
      focus: terminal.focus,
    }

    apiRef.current = api
    onReady(api)

    return () => {
      apiRef.current = null
      onReady(null)
    }
  }, [onReady, terminal.clear, terminal.focus, terminal.write, terminal.writeln])

  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY })
  }, [])

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0f1117] p-2">
      <div
        ref={terminal.containerRef}
        className="h-full w-full"
        onContextMenu={handleContextMenu}
        role="application"
        aria-label="SSH terminali"
      />

      {contextMenu ? (
        <TerminalContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onCopy={() => void terminal.copySelection()}
          onPaste={() => terminal.pasteFromClipboard()}
          onClear={terminal.clear}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </div>
  )
}
