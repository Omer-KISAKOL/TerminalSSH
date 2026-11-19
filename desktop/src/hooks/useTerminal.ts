import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { useCallback, useEffect, useRef } from 'react'

import { useAppearanceTheme } from '@/hooks/useAppearanceTheme'
import { debounce } from '@/lib/debounce'
import { isFullScreenTerminal } from '@/lib/terminal-mouse'

type UseTerminalOptions = {
  onInput: (data: string) => void
  onResize: (cols: number, rows: number) => void
  /** When false, skip fit/resize notifications (inactive workspace tab). */
  layoutActive?: boolean
}

type UseTerminalResult = {
  containerRef: React.RefObject<HTMLDivElement | null>
  clear: () => void
  write: (data: string) => void
  writeln: (message: string) => void
  focus: () => void
  refit: () => void
  copySelection: () => Promise<void>
  pasteFromClipboard: () => Promise<void>
  isFullScreen: () => boolean
  hasSelection: () => boolean
}

export function useTerminal({
  onInput,
  onResize,
  layoutActive = true,
}: UseTerminalOptions): UseTerminalResult {
  const { theme } = useAppearanceTheme()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const onInputRef = useRef(onInput)
  const onResizeRef = useRef(onResize)
  const themeRef = useRef(theme)
  const layoutActiveRef = useRef(layoutActive)

  useEffect(() => {
    layoutActiveRef.current = layoutActive
  }, [layoutActive])

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  useEffect(() => {
    onInputRef.current = onInput
    onResizeRef.current = onResize
  }, [onInput, onResize])

  useEffect(() => {
    const container = containerRef.current

    if (!container || terminalRef.current) {
      return
    }

    const palette = themeRef.current.colors

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily:
        'ui-monospace, "Cascadia Mono", "Cascadia Code", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.2,
      letterSpacing: 0,
      theme: {
        background: palette.terminalBackground,
        foreground: palette.terminalForeground,
        cursor: palette.terminalCursor,
      },
      scrollback: 5000,
      scrollSensitivity: 1,
      fastScrollSensitivity: 5,
      altClickMovesCursor: true,
      rightClickSelectsWord: false,
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(container)

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    const fitAndNotify = debounce(() => {
      if (!layoutActiveRef.current) {
        return
      }

      const width = container.clientWidth
      const height = container.clientHeight

      if (width < 8 || height < 8) {
        return
      }

      fitAddon.fit()
      terminal.refresh(0, terminal.rows - 1)
      onResizeRef.current(terminal.cols, terminal.rows)
    }, 150)

    const pasteText = (text: string) => {
      if (!text) {
        return
      }

      if (isFullScreenTerminal(terminal)) {
        // nano/vim: satır sonlarını CR'ye çevirir, destekleniyorsa bracketed paste kullanır.
        terminal.paste(text)
        return
      }

      onInputRef.current(text)
    }

    const dataDisposable = terminal.onData((data) => {
      onInputRef.current(data)
    })

    const binaryDisposable = terminal.onBinary((data) => {
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

      if (event.ctrlKey && !event.shiftKey && key === 'v') {
        event.preventDefault()
        void navigator.clipboard.readText().then(pasteText)
        return false
      }

      return true
    })

    // xterm'in paste olayını engelle; Ctrl+V yalnızca yukarıdaki handler'dan gider.
    const onPaste = (event: ClipboardEvent) => {
      event.preventDefault()
      event.stopImmediatePropagation()
    }

    container.addEventListener('paste', onPaste, true)

    // nano/vim fare raporlamasını açmadıysa: tıklanan hücreye ok tuşlarıyla git.
    const cellFromEvent = (event: MouseEvent) => {
      const screen = container.querySelector('.xterm-screen')

      if (!screen) {
        return null
      }

      const rect = screen.getBoundingClientRect()
      const col = Math.floor(((event.clientX - rect.left) / rect.width) * terminal.cols)
      const row = Math.floor(((event.clientY - rect.top) / rect.height) * terminal.rows)

      if (col < 0 || row < 0 || col >= terminal.cols || row >= terminal.rows) {
        return null
      }

      return { col, row }
    }

    const sendArrows = (direction: 'A' | 'B' | 'C' | 'D', count: number) => {
      if (count <= 0) {
        return
      }

      const prefix = terminal.modes.applicationCursorKeysMode ? '\x1bO' : '\x1b['
      onInputRef.current(`${prefix}${direction}`.repeat(count))
    }

    let downCell: { col: number; row: number } | null = null

    const onMouseDown = (event: MouseEvent) => {
      downCell =
        event.button === 0 && !event.shiftKey && !event.altKey ? cellFromEvent(event) : null
    }

    const onMouseUp = (event: MouseEvent) => {
      const start = downCell
      downCell = null

      if (
        !start ||
        event.button !== 0 ||
        terminal.buffer.active.type !== 'alternate' ||
        terminal.modes.mouseTrackingMode !== 'none'
      ) {
        return
      }

      const end = cellFromEvent(event)

      if (!end || end.col !== start.col || end.row !== start.row) {
        return
      }

      const buffer = terminal.buffer.active
      const dy = end.row - buffer.cursorY

      sendArrows(dy < 0 ? 'A' : 'B', Math.abs(dy))

      window.setTimeout(
        () => {
          const active = terminal.buffer.active
          const line = active.getLine(active.baseY + end.row)
          const lineLength = line ? line.translateToString(true).length : end.col
          const targetCol = Math.min(end.col, lineLength)
          const dx = targetCol - active.cursorX

          sendArrows(dx < 0 ? 'D' : 'C', Math.abs(dx))
        },
        dy === 0 ? 0 : 80,
      )
    }

    container.addEventListener('mousedown', onMouseDown)
    container.addEventListener('mouseup', onMouseUp)

    const resizeObserver = new ResizeObserver(() => {
      fitAndNotify()
    })

    resizeObserver.observe(container)
    fitAndNotify()

    return () => {
      binaryDisposable.dispose()
      dataDisposable.dispose()
      container.removeEventListener('paste', onPaste, true)
      container.removeEventListener('mousedown', onMouseDown)
      container.removeEventListener('mouseup', onMouseUp)
      resizeObserver.disconnect()
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [])

  useEffect(() => {
    const terminal = terminalRef.current

    if (!terminal) {
      return
    }

    terminal.options.theme = {
      background: theme.colors.terminalBackground,
      foreground: theme.colors.terminalForeground,
      cursor: theme.colors.terminalCursor,
    }
  }, [theme])

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

  const refit = useCallback(() => {
    const container = containerRef.current
    const terminal = terminalRef.current
    const fitAddon = fitAddonRef.current

    if (!container || !terminal || !fitAddon || !layoutActiveRef.current) {
      return
    }

    const width = container.clientWidth
    const height = container.clientHeight

    if (width < 8 || height < 8) {
      return
    }

    fitAddon.fit()
    terminal.refresh(0, terminal.rows - 1)
    onResizeRef.current(terminal.cols, terminal.rows)
  }, [])

  useEffect(() => {
    if (!layoutActive) {
      return
    }

    let innerFrame = 0
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        refit()
      })
    })

    return () => {
      cancelAnimationFrame(outerFrame)
      cancelAnimationFrame(innerFrame)
    }
  }, [layoutActive, refit])

  const isFullScreen = useCallback(() => {
    const terminal = terminalRef.current

    return terminal ? isFullScreenTerminal(terminal) : false
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
    const terminal = terminalRef.current

    if (!text) {
      return
    }

    if (terminal && isFullScreenTerminal(terminal)) {
      terminal.paste(text)
      return
    }

    onInputRef.current(text)
  }, [])

  return {
    containerRef,
    clear,
    write,
    writeln,
    focus,
    refit,
    copySelection,
    pasteFromClipboard,
    isFullScreen,
    hasSelection,
  }
}
