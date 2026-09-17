import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  ConnectRequest,
  ConnectionFormValues,
  ConnectionStatus,
} from '@shared/contracts/ssh'

type UseSshSessionOptions = {
  cols: number
  rows: number
  onData: (data: string) => void
  onTerminalMessage: (message: string) => void
}

type UseSshSessionResult = {
  sessionId: string | null
  status: ConnectionStatus
  errorMessage: string | null
  serverLabel: string | null
  isBusy: boolean
  connect: (values: ConnectionFormValues, label: string) => Promise<void>
  reconnect: () => Promise<void>
  disconnect: () => Promise<void>
  write: (data: string) => Promise<void>
  resize: (cols: number, rows: number) => Promise<void>
  reset: () => void
}

export function useSshSession({
  cols,
  rows,
  onData,
  onTerminalMessage,
}: UseSshSessionOptions): UseSshSessionResult {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [serverLabel, setServerLabel] = useState<string | null>(null)

  const sessionIdRef = useRef<string | null>(null)
  const lastConnectRequestRef = useRef<ConnectRequest | null>(null)
  const lastFormValuesRef = useRef<ConnectionFormValues | null>(null)
  const lastServerLabelRef = useRef<string | null>(null)
  const terminalSizeRef = useRef({ cols, rows })

  useEffect(() => {
    terminalSizeRef.current = { cols, rows }
  }, [cols, rows])

  useEffect(() => {
    sessionIdRef.current = sessionId
  }, [sessionId])

  useEffect(() => {
    const unsubscribeData = window.desktopApi.ssh.onData((event) => {
      if (
        sessionIdRef.current &&
        event.sessionId !== sessionIdRef.current
      ) {
        return
      }

      onData(event.data)
    })

    const unsubscribeStatus = window.desktopApi.ssh.onStatus((event) => {
      if (
        sessionIdRef.current &&
        event.sessionId !== sessionIdRef.current
      ) {
        return
      }

      setStatus(event.status)

      if (event.status === 'connecting') {
        setSessionId(event.sessionId)
        sessionIdRef.current = event.sessionId
      }

      if (event.status === 'error') {
        const message = event.message ?? 'Bağlantı kurulamadı.'
        setErrorMessage(message)
        onTerminalMessage(`[Hata: ${message}]`)
        setSessionId(null)
        sessionIdRef.current = null
      }

      if (event.status === 'disconnected') {
        setSessionId(null)
        sessionIdRef.current = null
        onTerminalMessage('[Bağlantı kesildi]')
      }

      if (event.status === 'connected') {
        setSessionId(event.sessionId)
        sessionIdRef.current = event.sessionId
        setErrorMessage(null)
      }
    })

    return () => {
      unsubscribeData()
      unsubscribeStatus()
    }
  }, [onData, onTerminalMessage])

  const connectWithRequest = useCallback(
    async (request: ConnectRequest, label: string, formValues: ConnectionFormValues) => {
      setStatus('connecting')
      setErrorMessage(null)
      setServerLabel(label)
      lastConnectRequestRef.current = request
      lastFormValuesRef.current = formValues
      lastServerLabelRef.current = label

      try {
        await window.desktopApi.ssh.connect(request)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Bağlantı kurulamadı.'
        setStatus('error')
        setErrorMessage(message)

        if (!sessionIdRef.current) {
          onTerminalMessage(`[Hata: ${message}]`)
        }
      }
    },
    [onTerminalMessage],
  )

  const connect = useCallback(
    async (values: ConnectionFormValues, label: string) => {
      const request: ConnectRequest = {
        host: values.host.trim(),
        port: Number.parseInt(values.port, 10),
        username: values.username.trim(),
        authType: values.authType,
        password: values.password,
        cols: terminalSizeRef.current.cols,
        rows: terminalSizeRef.current.rows,
      }

      await connectWithRequest(request, label, values)
    },
    [connectWithRequest],
  )

  const reconnect = useCallback(async () => {
    const previousRequest = lastConnectRequestRef.current
    const previousForm = lastFormValuesRef.current
    const previousLabel = lastServerLabelRef.current

    if (!previousRequest || !previousForm || !previousLabel) {
      return
    }

    if (sessionIdRef.current) {
      await window.desktopApi.ssh.disconnect(sessionIdRef.current)
      setSessionId(null)
      sessionIdRef.current = null
    }

    await connectWithRequest(
      {
        ...previousRequest,
        cols: terminalSizeRef.current.cols,
        rows: terminalSizeRef.current.rows,
      },
      previousLabel,
      previousForm,
    )
  }, [connectWithRequest])

  const disconnect = useCallback(async () => {
    const activeSessionId = sessionIdRef.current

    if (!activeSessionId) {
      setStatus('disconnected')
      return
    }

    setStatus('disconnecting')
    await window.desktopApi.ssh.disconnect(activeSessionId)
    setSessionId(null)
    sessionIdRef.current = null
    setStatus('disconnected')
  }, [])

  const write = useCallback(async (data: string) => {
    const activeSessionId = sessionIdRef.current

    if (!activeSessionId) {
      return
    }

    await window.desktopApi.ssh.write(activeSessionId, data)
  }, [])

  const resize = useCallback(async (nextCols: number, nextRows: number) => {
    const activeSessionId = sessionIdRef.current

    if (!activeSessionId) {
      return
    }

    await window.desktopApi.ssh.resize(activeSessionId, nextCols, nextRows)
  }, [])

  const reset = useCallback(() => {
    setSessionId(null)
    sessionIdRef.current = null
    setStatus('idle')
    setErrorMessage(null)
    setServerLabel(null)
  }, [])

  return {
    sessionId,
    status,
    errorMessage,
    serverLabel,
    isBusy: status === 'connecting' || status === 'disconnecting',
    connect,
    reconnect,
    disconnect,
    write,
    resize,
    reset,
  }
}
