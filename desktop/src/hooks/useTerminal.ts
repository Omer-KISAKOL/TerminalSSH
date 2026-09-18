import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { useCallback, useEffect, useRef } from 'react'

import { debounce } from '@/lib/debounce'

type UseTerminalOptions = {
  onInput: (data: string) => void
  onResize: (cols: number, rows: number) => void
}

type UseTerminalResult = {
  containerRef: React.RefObject<HTMLDivElement | null>
  clear: () => void
  write: (data: string) => void
  writeln: (message: string) => void
  focus: () => void
  copySelection: () => Promise<void>
  pasteFromClipboard: () => Promise<void>
  hasSelection: () => boolean
}

export function useTerminal({ onInput, onResize }: UseTerminalOptions): UseTerminalResult {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const onInputRef = useRef(onInput)
  const onResizeRef = useRef(onResize)

  useEffect(() => {
    onInputRef.current = onInput
    onResizeRef.current = onResize
  }, [onInput, onResize])

  useEffect(() => {
    const container = containerRef.current

    if (!container || terminalRef.current) {
      return
    }

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 14,
      theme: {
        background: '#0f1117',
        foreground: '#22c55e',
        cursor: '#22c55e',
      },
      scrollback: 5000,
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(container)

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    const fitAndNotify = debounce(() => {
      fitAddon.fit()
      onResizeRef.current(terminal.cols, terminal.rows)
    }, 150)

    const dataDisposable = terminal.onData((data) => {
      onInputRef.current(data)
    })

    terminal.attachCustomKeyEventHandler((event) => {
      if (event.type !== 'keydown' || event.altKey || event.metaKey) {
        return true
      }

      const key = event.key.toLowerCase()

      if (event.ctrlKey && key === 'c') {
        const selection = terminal.getSelection()

        if (selection) {
          void navigator.clipboard.writeText(selection)
          return false
        }

        return true
      }

      if (event.ctrlKey && key === 'v') {
        void navigator.clipboard.readText().then((text) => {
          if (text) {
            onInputRef.current(text)
          }
        })

        return false
      }

      return true
    })

    const resizeObserver = new ResizeObserver(() => {
      fitAndNotify()
    })

    resizeObserver.observe(container)
    fitAndNotify()

    return () => {
      dataDisposable.dispose()
      resizeObserver.disconnect()
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [])

  const clear = useCallback(() => {
    terminalRef.current?.clear()
  }, [])

  const write = useCallback((data: string) => {
    terminalRef.current?.write(data)
  }, [])

  const writeln = useCallback((message: string) => {
    terminalRef.current?.writeln(`\r\n\x1b[90m${message}\x1b[0m`)
  }, [])

  const focus = useCallback(() => {
    terminalRef.current?.focus()
  }, [])

  const hasSelection = useCallback(() => {
    return Boolean(terminalRef.current?.getSelection())
  }, [])

  const copySelection = useCallback(async () => {
    const selection = terminalRef.current?.getSelection()

    if (selection) {
      await navigator.clipboard.writeText(selection)
    }
  }, [])

  const pasteFromClipboard = useCallback(async () => {
    const text = await navigator.clipboard.readText()

    if (text) {
      onInputRef.current(text)
    }
  }, [])

  return {
    containerRef,
    clear,
    write,
    writeln,
    focus,
    copySelection,
    pasteFromClipboard,
    hasSelection,
  }
}
