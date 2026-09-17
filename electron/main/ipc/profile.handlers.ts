import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import { assertProfileId, assertSaveProfileRequest } from '@shared/validation/profile'

import { logger } from '../services/logger'
import { profileStore } from '../services/profile-store'
import { SecretStoreError } from '../services/secret-store'

import { createIpcHandler, createIpcVoidHandler, handleIpcError } from './ipc-utils'

function handleProfileError(error: unknown): never {
  if (error instanceof SecretStoreError) {
    throw new Error(error.message)
  }

  handleIpcError(error)
}

export function registerProfileHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.profiles.list, () => {
    return profileStore.list()
  })

  ipcMain.handle(
    IPC_CHANNELS.profiles.save,
    createIpcHandler(assertSaveProfileRequest, (_event, request) => {
      try {
        return profileStore.save(request)
      } catch (error) {
        handleProfileError(error)
      }
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.profiles.remove,
    createIpcVoidHandler(assertProfileId, (_event, profileId) => {
      profileStore.remove(profileId)
    }),
  )

  logger.debug('Profil IPC handler kayıtları tamamlandı')
}
