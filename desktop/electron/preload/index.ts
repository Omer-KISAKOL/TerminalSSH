import { contextBridge, ipcRenderer } from 'electron'

import type { HostVerifyRequestEvent } from '@shared/contracts/host'
import type { SftpStatusEvent } from '@shared/contracts/sftp'
import type { SshDataEvent, SshStatusEvent } from '@shared/contracts/ssh'
import { IPC_CHANNELS } from '@shared/ipc-channels'

import type { ReleaseCheckResponse } from '@shared/contracts/release'

import type { DesktopApi } from './api.types'

type UpdateStatusListener = (status: ReleaseCheckResponse) => void

const updateStatusListeners = new Set<UpdateStatusListener>()
let updateStatusBridgeRegistered = false

function ensureUpdateStatusBridge(): void {
  if (updateStatusBridgeRegistered) {
    return
  }

  updateStatusBridgeRegistered = true

  ipcRenderer.on(IPC_CHANNELS.app.updateStatus, (_event, payload: unknown) => {
    const status = payload as ReleaseCheckResponse

    for (const listener of updateStatusListeners) {
      listener(status)
    }
  })
}

type HostVerifyListener = (event: HostVerifyRequestEvent) => void

const hostVerifyListeners = new Set<HostVerifyListener>()
let hostVerifyBridgeRegistered = false

function ensureHostVerifyBridge(): void {
  if (hostVerifyBridgeRegistered) {
    return
  }

  hostVerifyBridgeRegistered = true

  ipcRenderer.on(IPC_CHANNELS.ssh.hostVerifyRequest, (_event, payload: unknown) => {
    const event = payload as HostVerifyRequestEvent

    for (const listener of hostVerifyListeners) {
      listener(event)
    }
  })
}

type SftpStatusListener = (event: SftpStatusEvent) => void

const sftpStatusListeners = new Set<SftpStatusListener>()
let sftpStatusBridgeRegistered = false

function ensureSftpStatusBridge(): void {
  if (sftpStatusBridgeRegistered) {
    return
  }

  sftpStatusBridgeRegistered = true

  ipcRenderer.on(IPC_CHANNELS.sftp.status, (_event, payload: unknown) => {
    const event = payload as SftpStatusEvent

    for (const listener of sftpStatusListeners) {
      listener(event)
    }
  })
}

const desktopApi: DesktopApi = {
  app: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.app.getVersion),
    checkForUpdate: () => ipcRenderer.invoke(IPC_CHANNELS.app.checkForUpdate),
    openUpdateDownload: (downloadUrl) =>
      ipcRenderer.invoke(IPC_CHANNELS.app.openUpdateDownload, downloadUrl),
    quitAndInstall: () => ipcRenderer.invoke(IPC_CHANNELS.app.quitAndInstall),
    onUpdateStatus: (callback) => {
      ensureUpdateStatusBridge()
      updateStatusListeners.add(callback)
      return () => {
        updateStatusListeners.delete(callback)
      }
    },
    syncLocale: (locale) => ipcRenderer.invoke(IPC_CHANNELS.app.syncLocale, locale),
    onOpenSftpTab: (callback) => {
      const listener = () => callback()
      ipcRenderer.on(IPC_CHANNELS.app.openSftpTab, listener)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.app.openSftpTab, listener)
      }
    },
    onFocusSftpTab: (callback) => {
      const listener = () => callback()
      ipcRenderer.on(IPC_CHANNELS.app.focusSftpTab, listener)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.app.focusSftpTab, listener)
      }
    },
    windowMinimize: () => ipcRenderer.invoke(IPC_CHANNELS.app.windowMinimize),
    windowToggleMaximize: () => ipcRenderer.invoke(IPC_CHANNELS.app.windowToggleMaximize),
    windowClose: () => ipcRenderer.invoke(IPC_CHANNELS.app.windowClose),
    windowIsMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.app.windowIsMaximized),
    onWindowMaximizeChanged: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, maximized: unknown) => {
        callback(Boolean(maximized))
      }

      ipcRenderer.on(IPC_CHANNELS.app.windowMaximizeChanged, listener)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.app.windowMaximizeChanged, listener)
      }
    },
  },
  ssh: {
    connect: (input) => ipcRenderer.invoke(IPC_CHANNELS.ssh.connect, input),
    write: (sessionId, data) => ipcRenderer.invoke(IPC_CHANNELS.ssh.write, { sessionId, data }),
    resize: (sessionId, cols, rows) =>
      ipcRenderer.invoke(IPC_CHANNELS.ssh.resize, { sessionId, cols, rows }),
    disconnect: (sessionId) => ipcRenderer.invoke(IPC_CHANNELS.ssh.disconnect, { sessionId }),
    onData: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: unknown) => {
        callback(payload as SshDataEvent)
      }

      ipcRenderer.on(IPC_CHANNELS.ssh.data, listener)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.ssh.data, listener)
      }
    },
    onStatus: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: unknown) => {
        callback(payload as SshStatusEvent)
      }

      ipcRenderer.on(IPC_CHANNELS.ssh.status, listener)
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.ssh.status, listener)
      }
    },
    onHostVerifyRequest: (callback) => {
      ensureHostVerifyBridge()
      hostVerifyListeners.add(callback)

      return () => {
        hostVerifyListeners.delete(callback)
      }
    },
    respondHostVerification: (verificationId, approved) =>
      ipcRenderer.invoke(IPC_CHANNELS.ssh.hostVerifyRespond, { verificationId, approved }),
  },
  sftp: {
    connect: (input) => ipcRenderer.invoke(IPC_CHANNELS.sftp.connect, input),
    listDir: (sessionId, path) =>
      ipcRenderer.invoke(IPC_CHANNELS.sftp.listDir, { sessionId, path }),
    upload: (sessionId, localPath, remotePath) =>
      ipcRenderer.invoke(IPC_CHANNELS.sftp.upload, { sessionId, localPath, remotePath }),
    download: (sessionId, remotePath, localPath) =>
      ipcRenderer.invoke(IPC_CHANNELS.sftp.download, { sessionId, remotePath, localPath }),
    disconnect: (sessionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.sftp.disconnect, { sessionId }),
    onStatus: (callback) => {
      ensureSftpStatusBridge()
      sftpStatusListeners.add(callback)

      return () => {
        sftpStatusListeners.delete(callback)
      }
    },
  },
  auth: {
    register: (input) => ipcRenderer.invoke(IPC_CHANNELS.auth.register, input),
    login: (input) => ipcRenderer.invoke(IPC_CHANNELS.auth.login, input),
    logout: () => ipcRenderer.invoke(IPC_CHANNELS.auth.logout),
    refresh: () => ipcRenderer.invoke(IPC_CHANNELS.auth.refresh),
    getSession: () => ipcRenderer.invoke(IPC_CHANNELS.auth.getSession),
    getPasswordResetQuestion: (input) =>
      ipcRenderer.invoke(IPC_CHANNELS.auth.getPasswordResetQuestion, input),
    resetPassword: (input) => ipcRenderer.invoke(IPC_CHANNELS.auth.resetPassword, input),
    completeSecuritySetup: (input) =>
      ipcRenderer.invoke(IPC_CHANNELS.auth.completeSecuritySetup, input),
  },
  profiles: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.profiles.list),
    save: (input) => ipcRenderer.invoke(IPC_CHANNELS.profiles.save, input),
    remove: (id) => ipcRenderer.invoke(IPC_CHANNELS.profiles.remove, id),
    sync: () => ipcRenderer.invoke(IPC_CHANNELS.profiles.sync),
    listLocalOnly: () => ipcRenderer.invoke(IPC_CHANNELS.profiles.listLocalOnly),
    importLocal: () => ipcRenderer.invoke(IPC_CHANNELS.profiles.importLocal),
    exportToFile: (input) => ipcRenderer.invoke(IPC_CHANNELS.profiles.exportToFile, input),
    importFromFile: () => ipcRenderer.invoke(IPC_CHANNELS.profiles.importFromFile),
    getEditSecrets: (id) => ipcRenderer.invoke(IPC_CHANNELS.profiles.getEditSecrets, id),
  },
  snippets: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.snippets.list),
    save: (input) => ipcRenderer.invoke(IPC_CHANNELS.snippets.save, input),
    remove: (snippetId) => ipcRenderer.invoke(IPC_CHANNELS.snippets.remove, snippetId),
    reorder: (orderedIds) => ipcRenderer.invoke(IPC_CHANNELS.snippets.reorder, orderedIds),
  },
  files: {
    selectPrivateKey: () => ipcRenderer.invoke(IPC_CHANNELS.files.selectPrivateKey),
    getHomeDir: () => ipcRenderer.invoke(IPC_CHANNELS.files.getHomeDir),
    listLocalDir: (path) => ipcRenderer.invoke(IPC_CHANNELS.files.listLocalDir, { path }),
  },
  serverOps: {
    getContext: (sessionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.serverOps.getContext, { sessionId }),
    collectIntelligence: (sessionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.serverOps.collectIntelligence, { sessionId }),
    collectDependencies: (sessionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.serverOps.collectDependencies, { sessionId }),
    collectProcesses: (sessionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.serverOps.collectProcesses, { sessionId }),
    collectDiskSpace: (sessionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.serverOps.collectDiskSpace, { sessionId }),
    collectConfigDrift: (sessionId, resetBaseline) =>
      ipcRenderer.invoke(IPC_CHANNELS.serverOps.collectConfigDrift, { sessionId, resetBaseline }),
    collectEnvInspector: (sessionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.serverOps.collectEnvInspector, { sessionId }),
    collectEndpointMonitor: (sessionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.serverOps.collectEndpointMonitor, { sessionId }),
    collectIncidentAnalyzer: (sessionId) =>
      ipcRenderer.invoke(IPC_CHANNELS.serverOps.collectIncidentAnalyzer, { sessionId }),
    listTimeline: (input) => ipcRenderer.invoke(IPC_CHANNELS.serverOps.listTimeline, input),
    purgeTimeline: () => ipcRenderer.invoke(IPC_CHANNELS.serverOps.purgeTimeline),
    recordSuggestion: (input) => ipcRenderer.invoke(IPC_CHANNELS.serverOps.recordSuggestion, input),
  },
}

contextBridge.exposeInMainWorld('desktopApi', desktopApi)
