import { BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'

import { logger } from '../services/logger'

export function registerDialogHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.files.selectPrivateKey, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const dialogOptions: OpenDialogOptions = {
      title: 'Özel anahtar dosyası seç',
      properties: ['openFile'],
      filters: [
        { name: 'SSH Private Keys', extensions: ['pem', 'key', 'ppk', 'pub'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    }

    const result = window
      ? await dialog.showOpenDialog(window, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0] ?? null
  })

  logger.debug('Dialog IPC handler kayıtları tamamlandı')
}
