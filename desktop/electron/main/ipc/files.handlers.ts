import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import { assertLocalListDirRequest } from '@shared/validation/sftp'

import { localFilesService } from '../services/local-files-service'

import { createIpcHandler } from './ipc-utils'

export function registerFilesHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.files.getHomeDir, () => {
    return localFilesService.getHomeDirectory()
  })

  ipcMain.handle(
    IPC_CHANNELS.files.listLocalDir,
    createIpcHandler(assertLocalListDirRequest, (_event, payload) => {
      return localFilesService.listDirectory(payload.path)
    }),
  )
}
