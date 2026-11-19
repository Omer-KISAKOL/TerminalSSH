import { app, ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import type { AppLocale } from '@shared/i18n/locale'

function isAppLocale(value: unknown): value is AppLocale {
  return value === 'tr' || value === 'en'
}

export function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.app.getVersion, () => app.getVersion())

  ipcMain.handle(IPC_CHANNELS.app.syncLocale, (_event, payload: unknown) => {
    if (!isAppLocale(payload)) {
      return false
    }

    return true
  })
}
