import '@xterm/xterm/css/xterm.css'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useCommandQueue, type CommandQueueInputOptions } from '@/hooks/useCommandQueue'
import { useTerminal } from '@/hooks/useTerminal'

import { useLocale } from '@/hooks/useLocale'

import { CommandQueueEditor } from './CommandQueueEditor'
import { TerminalContextMenu } from './TerminalContextMenu'

export type TerminalApi = {
  write: (data: string) => void
  writeln: (message: string) => void
  clear: () => void
  focus: () => void
  submit: (data: string, options?: CommandQueueInputOptions) => void
}

type TerminalViewProps = {
  isActive?: boolean
  onReady: (api: TerminalApi | null) => void
  onInput: (data: string) => void
  onResize: (cols: number, rows: number) => void
}

type ContextMenuState = {
  x: number
  y: number
}

export function TerminalView({ isActive = true, onReady, onInput, onResize }: TerminalViewProps) {
  const { t } = useLocale()
  const fullScreenRef = useRef<() => boolean>(() => false)
  const {
    snapshot,
    handleInput,
    observeOutput,
    begin,
    cancel,
    setWriteLocal,
    getEditorText,
    applyEditorText,
  } = useCommandQueue(onInput, () => fullScreenRef.current())
  const terminal = useTerminal({ onInput: handleInput, onResize, layoutActive: isActive })
  fullScreenRef.current = terminal.isFullScreen
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
    <div className="terminal-host relative min-h-0 flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className="terminal-surface h-full min-h-0 w-full px-4 py-2.5 sm:px-5 md:px-6"
        onContextMenu={handleContextMenu}
        role="application"
        aria-label={t('terminal.ariaLabel')}
      />

      <CommandQueueEditor
        snapshot={snapshot}
        getEditorText={getEditorText}
        onApplyEditorText={applyEditorText}
        onBegin={() => {
          begin()
          focus()
        }}
        onCancel={() => {
          cancel()
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
