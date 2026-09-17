import { useCallback, useEffect, useRef, useState } from 'react'

import type { ConnectionFormValues, ConnectionStatus } from '@shared/contracts/ssh'

import { ConnectionForm } from '@/components/connection/ConnectionForm'
import { TerminalToolbar } from '@/components/terminal/TerminalToolbar'
import { TerminalView, type TerminalApi } from '@/components/terminal/TerminalView'
import { useSshSession } from '@/hooks/useSshSession'
import { DEFAULT_CONNECTION_FORM, getConnectionLabel } from '@/lib/connection-form'

import { Sidebar } from './Sidebar'

type AppShellProps = {
  appVersion: string | null
}

export function AppShell({ appVersion }: AppShellProps) {
  const terminalApiRef = useRef<TerminalApi | null>(null)

  const handleTerminalReady = useCallback((api: TerminalApi | null) => {
    terminalApiRef.current = api
  }, [])
  const [view, setView] = useState<'form' | 'terminal'>('form')
  const [terminalMounted, setTerminalMounted] = useState(false)
  const [formValues, setFormValues] = useState<ConnectionFormValues>(DEFAULT_CONNECTION_FORM)
  const [terminalSize, setTerminalSize] = useState({ cols: 80, rows: 24 })

  const handleTerminalData = useCallback((data: string) => {
    terminalApiRef.current?.write(data)
  }, [])

  const handleTerminalMessage = useCallback((message: string) => {
    terminalApiRef.current?.writeln(message)
  }, [])

  const ssh = useSshSession({
    cols: terminalSize.cols,
    rows: terminalSize.rows,
    onData: handleTerminalData,
    onTerminalMessage: handleTerminalMessage,
  })

  const handleConnect = useCallback(
    async (values: ConnectionFormValues) => {
      setFormValues(values)
      setTerminalMounted(true)
      setView('terminal')
      const label = getConnectionLabel(values)
      await ssh.connect(values, label)
    },
    [ssh],
  )

  useEffect(() => {
    if (ssh.status === 'connected') {
      terminalApiRef.current?.focus()
    }
  }, [ssh.status])

  const handleNewConnection = useCallback(async () => {
    await ssh.disconnect()
    ssh.reset()
    setView('form')
  }, [ssh])

  const handleReconnect = useCallback(async () => {
    await ssh.reconnect()
    terminalApiRef.current?.focus()
  }, [ssh])

  const handleDisconnect = useCallback(async () => {
    await ssh.disconnect()
  }, [ssh])

  const handleClear = useCallback(() => {
    terminalApiRef.current?.clear()
  }, [])

  const handleResize = useCallback(
    (cols: number, rows: number) => {
      setTerminalSize({ cols, rows })
      void ssh.resize(cols, rows)
    },
    [ssh],
  )

  const handleInput = useCallback(
    (data: string) => {
      void ssh.write(data)
    },
    [ssh],
  )

  const showTerminal = view === 'terminal'
  const status: ConnectionStatus = showTerminal ? ssh.status : 'idle'

  return (
    <div className="flex h-full min-h-0 bg-surface">
      <Sidebar onNewConnection={() => void handleNewConnection()} />

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {terminalMounted ? (
          <div
            className={
              showTerminal
                ? 'flex min-h-0 flex-1 flex-col'
                : 'pointer-events-none invisible absolute inset-0 flex min-h-0 flex-col'
            }
          >
            <TerminalToolbar
              serverLabel={ssh.serverLabel}
              status={status}
              onReconnect={() => void handleReconnect()}
              onDisconnect={() => void handleDisconnect()}
              onClear={handleClear}
            />
            <TerminalView
              onReady={handleTerminalReady}
              onInput={handleInput}
              onResize={handleResize}
            />
          </div>
        ) : null}

        {!showTerminal ? (
          <>
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-base font-medium text-white">Bağlantı</h2>
                <p className="text-sm text-text-muted">
                  SSH oturumu başlatmak için bağlantı bilgilerini girin.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-status-idle"
                  aria-hidden="true"
                />
                Bağlı değil
              </div>
            </header>

            <section className="flex flex-1 items-center justify-center p-8">
              <div className="w-full max-w-xl">
                <ConnectionForm
                  key="connection-form"
                  disabled={ssh.isBusy}
                  initialValues={formValues}
                  onSubmit={handleConnect}
                />
                {appVersion ? (
                  <p className="mt-4 text-center text-xs text-text-muted">
                    Uygulama sürümü: <span className="font-mono text-text">{appVersion}</span>
                  </p>
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  )
}
