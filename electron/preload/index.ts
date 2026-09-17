import { contextBridge, ipcRenderer } from 'electron'

import type { HostVerifyRequestEvent } from '@shared/contracts/host'
import type { SshDataEvent, SshStatusEvent } from '@shared/contracts/ssh'
import { IPC_CHANNELS } from '@shared/ipc-channels'

import type { DesktopApi } from './api.types'

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

const desktopApi: DesktopApi = {
  app: {
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.app.getVersion),
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
  profiles: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.profiles.list),
    save: (input) => ipcRenderer.invoke(IPC_CHANNELS.profiles.save, input),
    remove: (id) => ipcRenderer.invoke(IPC_CHANNELS.profiles.remove, id),
  },
  files: {
    selectPrivateKey: () => ipcRenderer.invoke(IPC_CHANNELS.files.selectPrivateKey),
  },
}

contextBridge.exposeInMainWorld('desktopApi', desktopApi)
