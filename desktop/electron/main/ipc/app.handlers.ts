import { app, ipcMain } from 'electron'

import { setupApplicationMenu } from '../application-menu'

import type { AppLocale } from '@shared/i18n/locale'
import { IPC_CHANNELS } from '@shared/ipc-channels'

function isAppLocale(value: unknown): value is AppLocale {
  return value === 'tr' || value === 'en'
}

export function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.app.getVersion, () => app.getVersion())

  ipcMain.handle(IPC_CHANNELS.app.syncLocale, (_event, payload: unknown) => {
    if (!isAppLocale(payload)) {
      return false
    }

    setupApplicationMenu(payload)
    return true
  })
}
