import { useCallback, useEffect, useRef, useState } from 'react'

import type { ConnectionFormValues, ConnectionStatus } from '@shared/contracts/ssh'
import type { WorkspaceTab } from '@shared/contracts/workspace'

import { toUserErrorMessage } from '@/lib/user-error'
import {
  createSftpTab,
  createTerminalTab,
  formValuesToConnectRequest,
  formValuesToSftpRequest,
  getTabLabel,
} from '@/lib/workspace'

type UseWorkspaceTabsOptions = {
  terminalSize: { cols: number; rows: number }
  onTerminalData: (tabId: string, data: string) => void
  onTerminalMessage: (tabId: string, message: string) => void
}

export function useWorkspaceTabs({
  terminalSize,
  onTerminalData,
  onTerminalMessage,
}: UseWorkspaceTabsOptions) {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  const tabsRef = useRef(tabs)
  const activeTabIdRef = useRef(activeTabId)
  const terminalSizeRef = useRef(terminalSize)
  const onTerminalDataRef = useRef(onTerminalData)
  const onTerminalMessageRef = useRef(onTerminalMessage)
  const listenersRegisteredRef = useRef(false)

  useEffect(() => {
    tabsRef.current = tabs
  }, [tabs])

  useEffect(() => {
    activeTabIdRef.current = activeTabId
  }, [activeTabId])

  useEffect(() => {
    terminalSizeRef.current = terminalSize
  }, [terminalSize])

  useEffect(() => {
    onTerminalDataRef.current = onTerminalData
  }, [onTerminalData])

  useEffect(() => {
    onTerminalMessageRef.current = onTerminalMessage
  }, [onTerminalMessage])

  const updateTab = useCallback((tabId: string, patch: Partial<WorkspaceTab>) => {
    setTabs((current) =>
      current.map((tab) => (tab.id === tabId ? ({ ...tab, ...patch } as WorkspaceTab) : tab)),
    )
  }, [])

  const findTabBySessionId = useCallback((sessionId: string) => {
    return tabsRef.current.find((tab) => tab.sessionId === sessionId) ?? null
  }, [])

  useEffect(() => {
    if (listenersRegisteredRef.current) {
      return
    }

    listenersRegisteredRef.current = true

    const unsubscribeSshData = window.desktopApi.ssh.onData((event) => {
      const tab = tabsRef.current.find((item) => item.sessionId === event.sessionId)

      if (tab?.type === 'terminal') {
        onTerminalDataRef.current(tab.id, event.data)
      }
    })

    const unsubscribeSshStatus = window.desktopApi.ssh.onStatus((event) => {
      let tab = tabsRef.current.find(
        (item) => item.type === 'terminal' && item.sessionId === event.sessionId,
      )

      if (!tab) {
        tab = tabsRef.current.find(
          (item) =>
            item.type === 'terminal' &&
            item.status === 'connecting' &&
            item.sessionId === null,
        )
      }

      if (!tab || tab.type !== 'terminal') {
        return
      }

      if (event.status === 'error') {
        onTerminalMessageRef.current(tab.id, `[Hata: ${event.message ?? 'Bağlantı kurulamadı.'}]`)
        updateTab(tab.id, {
          status: event.status,
          errorMessage: event.message ?? 'Bağlantı kurulamadı.',
          sessionId: null,
        })
        return
      }

      if (event.status === 'disconnected') {
        onTerminalMessageRef.current(tab.id, '[Bağlantı kesildi]')
        updateTab(tab.id, {
          status: event.status,
          sessionId: null,
        })
        return
      }

      updateTab(tab.id, {
        status: event.status,
        sessionId: event.sessionId,
        errorMessage: event.message ?? null,
      })
    })

    const unsubscribeSftpStatus = window.desktopApi.sftp.onStatus((event) => {
      let tab = tabsRef.current.find(
        (item) => item.type === 'sftp' && item.sessionId === event.sessionId,
      )

      if (!tab) {
        tab = tabsRef.current.find(
          (item) =>
            item.type === 'sftp' && item.status === 'connecting' && item.sessionId === null,
        )
      }

      if (!tab || tab.type !== 'sftp') {
        return
      }

      updateTab(tab.id, {
        status: event.status,
        sessionId: event.sessionId,
        errorMessage: event.message ?? null,
        connected: event.status === 'connected',
        remotePath: event.status === 'connected' ? tab.remotePath : tab.remotePath,
      })
    })

    return () => {
      listenersRegisteredRef.current = false
      unsubscribeSshData()
      unsubscribeSshStatus()
      unsubscribeSftpStatus()
    }
  }, [updateTab])

  useEffect(() => {
    return () => {
      for (const tab of tabsRef.current) {
        if (!tab.sessionId) {
          continue
        }

        if (tab.type === 'terminal') {
          void window.desktopApi.ssh.disconnect(tab.sessionId)
        } else {
          void window.desktopApi.sftp.disconnect(tab.sessionId)
        }
      }
    }
  }, [])

  const addTerminalTab = useCallback(() => {
    const tab = createTerminalTab()
    setTabs((current) => [...current, tab])
    setActiveTabId(tab.id)
    return tab.id
  }, [])

  const addSftpTab = useCallback(async () => {
    const homeDir = await window.desktopApi.files.getHomeDir()
    const tab = { ...createSftpTab(), localPath: homeDir }
    setTabs((current) => [...current, tab])
    setActiveTabId(tab.id)
    return tab.id
  }, [])

  const closeTab = useCallback(
    async (tabId: string) => {
      const tab = tabsRef.current.find((item) => item.id === tabId)

      if (tab?.sessionId) {
        if (tab.type === 'terminal') {
          await window.desktopApi.ssh.disconnect(tab.sessionId)
        } else {
          await window.desktopApi.sftp.disconnect(tab.sessionId)
        }
      }

      setTabs((current) => {
        const next = current.filter((item) => item.id !== tabId)

        if (activeTabIdRef.current === tabId) {
          setActiveTabId(next.at(-1)?.id ?? null)
        }

        return next
      })
    },
    [],
  )

  const connectTerminalTab = useCallback(
    async (tabId: string, values: ConnectionFormValues) => {
      const label = getTabLabel(values, 'terminal')
      updateTab(tabId, {
        label,
        connectValues: values,
        status: 'connecting',
        errorMessage: null,
      })

      try {
        const response = await window.desktopApi.ssh.connect(
          formValuesToConnectRequest(
            values,
            terminalSizeRef.current.cols,
            terminalSizeRef.current.rows,
          ),
        )

        updateTab(tabId, {
          sessionId: response.sessionId,
          status: 'connected',
          errorMessage: null,
        })
      } catch (error) {
        const message = toUserErrorMessage(error)
        updateTab(tabId, {
          status: 'error',
          errorMessage: message,
          sessionId: null,
        })
        onTerminalMessageRef.current(tabId, `[Hata: ${message}]`)
      }
    },
    [updateTab],
  )

  const connectSftpTab = useCallback(
    async (tabId: string, values: ConnectionFormValues) => {
      const label = getTabLabel(values, 'sftp')
      updateTab(tabId, {
        label,
        connectValues: values,
        status: 'connecting',
        errorMessage: null,
      })

      try {
        const response = await window.desktopApi.sftp.connect(formValuesToSftpRequest(values))

        updateTab(tabId, {
          sessionId: response.sessionId,
          status: 'connected',
          errorMessage: null,
          connected: true,
          remotePath: '/',
        } as Partial<WorkspaceTab>)
      } catch (error) {
        const message = toUserErrorMessage(error)
        updateTab(tabId, {
          status: 'error',
          errorMessage: message,
          sessionId: null,
          connected: false,
        } as Partial<WorkspaceTab>)
      }
    },
    [updateTab],
  )

  const openTerminalSession = useCallback(
    async (values: ConnectionFormValues) => {
      let tabId = activeTabIdRef.current
      const activeTab = tabId ? tabsRef.current.find((tab) => tab.id === tabId) : null

      if (!activeTab || activeTab.type !== 'terminal' || activeTab.sessionId) {
        tabId = addTerminalTab()
      }

      if (!tabId) {
        return
      }

      setActiveTabId(tabId)
      await connectTerminalTab(tabId, values)
      return tabId
    },
    [addTerminalTab, connectTerminalTab],
  )

  const openSftpSession = useCallback(
    async (values: ConnectionFormValues) => {
      const tabId = await addSftpTab()
      await connectSftpTab(tabId, values)
      return tabId
    },
    [addSftpTab, connectSftpTab],
  )

  const reconnectTab = useCallback(
    async (tabId: string) => {
      const tab = tabsRef.current.find((item) => item.id === tabId)

      if (!tab?.connectValues) {
        return
      }

      if (tab.sessionId) {
        if (tab.type === 'terminal') {
          await window.desktopApi.ssh.disconnect(tab.sessionId)
        } else {
          await window.desktopApi.sftp.disconnect(tab.sessionId)
        }
      }

      if (tab.type === 'terminal') {
        await connectTerminalTab(tabId, tab.connectValues)
      } else {
        await connectSftpTab(tabId, tab.connectValues)
      }
    },
    [connectSftpTab, connectTerminalTab],
  )

  const disconnectTab = useCallback(
    async (tabId: string) => {
      const tab = tabsRef.current.find((item) => item.id === tabId)

      if (!tab?.sessionId) {
        updateTab(tabId, { status: 'disconnected' })
        return
      }

      updateTab(tabId, { status: 'disconnecting' })

      if (tab.type === 'terminal') {
        await window.desktopApi.ssh.disconnect(tab.sessionId)
      } else {
        await window.desktopApi.sftp.disconnect(tab.sessionId)
      }

      updateTab(tabId, {
        status: 'disconnected',
        sessionId: null,
        connected: tab.type === 'sftp' ? false : undefined,
      } as Partial<WorkspaceTab>)
    },
    [updateTab],
  )

  const writeToTerminalTab = useCallback(async (tabId: string, data: string) => {
    const tab = tabsRef.current.find((item) => item.id === tabId)

    if (tab?.type !== 'terminal' || !tab.sessionId) {
      return
    }

    await window.desktopApi.ssh.write(tab.sessionId, data)
  }, [])

  const resizeTerminalTab = useCallback(async (tabId: string, cols: number, rows: number) => {
    const tab = tabsRef.current.find((item) => item.id === tabId)

    if (tab?.type !== 'terminal' || !tab.sessionId) {
      return
    }

    await window.desktopApi.ssh.resize(tab.sessionId, cols, rows)
  }, [])

  const setSftpLocalPath = useCallback((tabId: string, localPath: string) => {
    setTabs((current) =>
      current.map((tab) => {
        if (tab.id !== tabId || tab.type !== 'sftp' || tab.localPath === localPath) {
          return tab
        }

        return { ...tab, localPath }
      }),
    )
  }, [])

  const setSftpRemotePath = useCallback((tabId: string, remotePath: string) => {
    setTabs((current) =>
      current.map((tab) => {
        if (tab.id !== tabId || tab.type !== 'sftp' || tab.remotePath === remotePath) {
          return tab
        }

        return { ...tab, remotePath }
      }),
    )
  }, [])

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null
  const hasOpenTabs = tabs.length > 0
  const isBusy = tabs.some(
    (tab) => tab.status === 'connecting' || tab.status === 'disconnecting',
  )

  return {
    tabs,
    activeTab,
    activeTabId,
    hasOpenTabs,
    isBusy,
    setActiveTabId,
    addTerminalTab,
    addSftpTab,
    closeTab,
    openTerminalSession,
    openSftpSession,
    connectTerminalTab,
    connectSftpTab,
    reconnectTab,
    disconnectTab,
    writeToTerminalTab,
    resizeTerminalTab,
    setSftpLocalPath,
    setSftpRemotePath,
    findTabBySessionId,
  }
}

export type WorkspaceTabsController = ReturnType<typeof useWorkspaceTabs>

export function getTabStatus(tab: WorkspaceTab | null): ConnectionStatus {
  return tab?.status ?? 'idle'
}
