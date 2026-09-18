import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import { assertProfileId, assertSaveProfileRequest } from '@shared/validation/profile'

import { logger } from '../services/logger'
import { profileManager } from '../services/profile-manager'
import { SecretStoreError } from '../services/secret-store'

import { createIpcHandler, createIpcVoidHandler, handleIpcError } from './ipc-utils'

function handleProfileError(error: unknown): never {
  if (error instanceof SecretStoreError) {
    throw new Error(error.message)
  }

  handleIpcError(error)
}

export function registerProfileHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.profiles.list, async () => {
    return profileManager.list()
  })

  ipcMain.handle(
    IPC_CHANNELS.profiles.save,
    createIpcHandler(assertSaveProfileRequest, async (_event, request) => {
      try {
        return await profileManager.save(request)
      } catch (error) {
        handleProfileError(error)
      }
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.profiles.remove,
    createIpcVoidHandler(assertProfileId, async (_event, profileId) => {
      await profileManager.remove(profileId)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.profiles.sync, async () => {
    return profileManager.sync()
  })

  ipcMain.handle(IPC_CHANNELS.profiles.listLocalOnly, () => {
    return profileManager.listLocalMigrationCandidates()
  })

  ipcMain.handle(IPC_CHANNELS.profiles.importLocal, async () => {
    return profileManager.importLocalProfiles()
  })

  logger.debug('Profil IPC handler kayıtları tamamlandı')
}
