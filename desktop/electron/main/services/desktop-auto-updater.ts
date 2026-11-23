import { app, type BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

import type { DesktopUpdatePhase, ReleaseCheckResponse } from '@shared/contracts/release'
import { IPC_CHANNELS } from '@shared/ipc-channels'

import { getApiBaseUrl } from '../api-base-url'

type DesktopUpdateSnapshot = ReleaseCheckResponse & {
  phase: DesktopUpdatePhase
  percent: number | null
  nativeAutoUpdate: boolean
  errorMessage: string | null
}

let mainWindow: BrowserWindow | null = null
let started = false

const snapshot: DesktopUpdateSnapshot = {
  updateAvailable: false,
  currentVersion: app.getVersion(),
  latestVersion: null,
  downloadUrl: null,
  releaseNotes: null,
  phase: 'idle',
  percent: null,
  nativeAutoUpdate: false,
  errorMessage: null,
}

function publishSnapshot() {
  mainWindow?.webContents.send(IPC_CHANNELS.app.updateStatus, { ...snapshot })
}

function markSnapshot(patch: Partial<DesktopUpdateSnapshot>) {
  Object.assign(snapshot, patch)
  publishSnapshot()
}

export function bindDesktopAutoUpdaterWindow(window: BrowserWindow): void {
  mainWindow = window
  publishSnapshot()
}

export function getDesktopUpdateSnapshot(): DesktopUpdateSnapshot {
  return { ...snapshot }
}

export function quitAndInstallDesktopUpdate(): void {
  if (!app.isPackaged) {
    return
  }

  autoUpdater.quitAndInstall(false, true)
}

export function startDesktopAutoUpdater(): void {
  if (!app.isPackaged || started) {
    return
  }

  started = true
  snapshot.nativeAutoUpdate = true
  snapshot.currentVersion = app.getVersion()

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowDowngrade = false

  const feedUrl = `${getApiBaseUrl().replace(/\/$/, '')}/releases/electron/`

  autoUpdater.setFeedURL({
    provider: 'generic',
    url: feedUrl,
  })

  autoUpdater.on('checking-for-update', () => {
    markSnapshot({ phase: 'checking', errorMessage: null })
  })

  autoUpdater.on('update-available', (info) => {
    markSnapshot({
      updateAvailable: true,
      phase: 'available',
      latestVersion: info.version,
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : null,
      downloadUrl: feedUrl,
    })
  })

  autoUpdater.on('update-not-available', () => {
    markSnapshot({
      updateAvailable: false,
      phase: 'idle',
      latestVersion: null,
      downloadUrl: null,
      releaseNotes: null,
      percent: null,
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    markSnapshot({
      phase: 'downloading',
      percent: progress.percent,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    markSnapshot({
      updateAvailable: true,
      phase: 'ready',
      latestVersion: info.version,
      percent: 100,
    })
  })

  autoUpdater.on('error', (error) => {
    markSnapshot({
      phase: 'error',
      errorMessage: error.message,
    })
  })

  markSnapshot({ phase: 'checking' })
  void autoUpdater.checkForUpdates()
}