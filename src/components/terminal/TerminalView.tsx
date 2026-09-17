import '@xterm/xterm/css/xterm.css'

import { useEffect } from 'react'

import { useTerminal } from '@/hooks/useTerminal'

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

export function TerminalView({ onReady, onInput, onResize }: TerminalViewProps) {
  const terminal = useTerminal({ onInput, onResize })

  useEffect(() => {
    onReady({
      write: terminal.write,
      writeln: terminal.writeln,
      clear: terminal.clear,
      focus: terminal.focus,
    })

    return () => {
      onReady(null)
    }
  }, [onReady, terminal.clear, terminal.focus, terminal.write, terminal.writeln])

  return (
    <div className="min-h-0 flex-1 overflow-hidden bg-[#0f1117] p-2">
      <div ref={terminal.containerRef} className="h-full w-full" />
    </div>
  )
}
