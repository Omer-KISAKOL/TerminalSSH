import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import { assertProfileId, assertSaveProfileRequest } from '@shared/validation/profile'
import { IpcValidationError } from '@shared/validation/ssh'

import { logger } from '../services/logger'
import { profileStore } from '../services/profile-store'
import { SecretStoreError } from '../services/secret-store'

function handleValidationError(error: unknown): never {
  if (error instanceof IpcValidationError || error instanceof SecretStoreError) {
    throw new Error(error.message)
  }

  throw error
}

export function registerProfileHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.profiles.list, () => {
    return profileStore.list()
  })

  ipcMain.handle(IPC_CHANNELS.profiles.save, (_event, input) => {
    try {
      const request = assertSaveProfileRequest(input)
      return profileStore.save(request)
    } catch (error) {
      handleValidationError(error)
    }
  })

  ipcMain.handle(IPC_CHANNELS.profiles.remove, (_event, input) => {
    try {
      const profileId = assertProfileId(input)
      profileStore.remove(profileId)
    } catch (error) {
      handleValidationError(error)
    }
  })

  logger.debug('Profil IPC handler kayıtları tamamlandı')
}
