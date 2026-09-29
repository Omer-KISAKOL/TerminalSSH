import '@xterm/xterm/css/xterm.css'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useCommandQueue, type CommandQueueInputOptions } from '@/hooks/useCommandQueue'
import { useTerminal } from '@/hooks/useTerminal'

import { CommandQueueBanner } from './CommandQueueBanner'
import { TerminalContextMenu } from './TerminalContextMenu'

export type TerminalApi = {
  write: (data: string) => void
  writeln: (message: string) => void
  clear: () => void
  focus: () => void
  submit: (data: string, options?: CommandQueueInputOptions) => void
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
  const { snapshot, handleInput, observeOutput, begin, cancel, dropPending, setWriteLocal } =
    useCommandQueue(onInput)
  const terminal = useTerminal({ onInput: handleInput, onResize })
  const { clear, containerRef, copySelection, focus, pasteFromClipboard, write, writeln } = terminal
  const apiRef = useRef<TerminalApi | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  useEffect(() => {
    setWriteLocal(write)
  }, [setWriteLocal, write])

  useEffect(() => {
    const api: TerminalApi = {
      write: (data) => {
        observeOutput(data)
        write(data)
      },
      writeln,
      clear,
      focus,
      submit: handleInput,
    }

    apiRef.current = api
    onReady(api)

    return () => {
      apiRef.current = null
      onReady(null)
    }
  }, [clear, focus, handleInput, observeOutput, onReady, write, writeln])

  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY })
  }, [])

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0f1117] p-2">
      <div
        ref={containerRef}
        className="h-full w-full"
        onContextMenu={handleContextMenu}
        role="application"
        aria-label="SSH terminali"
      />

      <CommandQueueBanner
        snapshot={snapshot}
        onBegin={() => {
          begin()
          focus()
        }}
        onCancel={() => {
          cancel()
          focus()
        }}
        onDropPending={() => {
          dropPending()
          focus()
        }}
      />

      {contextMenu ? (
        <TerminalContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onCopy={() => void copySelection()}
          onPaste={() => pasteFromClipboard()}
          onClear={clear}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </div>
  )
}
