import { app, ipcMain, shell } from 'electron'

import type { ReleaseCheckResponse } from '@shared/contracts/release'
import { IPC_CHANNELS } from '@shared/ipc-channels'
import type { AppLocale } from '@shared/i18n/locale'

import { getApiBaseUrl as resolveApiBaseUrl } from '../api-base-url'
import {
  getDesktopUpdateSnapshot,
  quitAndInstallDesktopUpdate,
} from '../services/desktop-auto-updater'
import { resolveDesktopReleasePlatform } from '../services/release-platform'

function isAppLocale(value: unknown): value is AppLocale {
  return value === 'tr' || value === 'en'
}

function isSafeDownloadUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.app.getVersion, () => app.getVersion())

  ipcMain.handle(IPC_CHANNELS.app.checkForUpdate, async (): Promise<ReleaseCheckResponse> => {
    if (app.isPackaged) {
      return getDesktopUpdateSnapshot()
    }

    const baseUrl = resolveApiBaseUrl()
    const platform = resolveDesktopReleasePlatform()
    const current = app.getVersion()
    const query = new URLSearchParams({ platform, current })
    const response = await fetch(`${baseUrl}/releases/check?${query.toString()}`)

    if (!response.ok) {
      throw new Error(`Güncelleme kontrolü başarısız (HTTP ${response.status}).`)
    }

    return (await response.json()) as ReleaseCheckResponse
  })

  ipcMain.handle(IPC_CHANNELS.app.quitAndInstall, () => {
    quitAndInstallDesktopUpdate()
    return true
  })

  ipcMain.handle(IPC_CHANNELS.app.openUpdateDownload, async (_event, downloadUrl: unknown) => {
    if (typeof downloadUrl !== 'string' || !isSafeDownloadUrl(downloadUrl)) {
      throw new Error('Geçersiz indirme adresi.')
    }

    await shell.openExternal(downloadUrl)
    return true
  })

  ipcMain.handle(IPC_CHANNELS.app.syncLocale, (_event, payload: unknown) => {
    if (!isAppLocale(payload)) {
      return false
    }

    return true
  })
}
