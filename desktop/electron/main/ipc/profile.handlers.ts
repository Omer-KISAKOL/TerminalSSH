import { readFileSync, writeFileSync } from 'node:fs'

import { BrowserWindow, dialog, ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import { assertProfileExportBundle } from '@shared/validation/profile-export'
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

  ipcMain.handle(
    IPC_CHANNELS.profiles.exportToFile,
    async (event, input: unknown) => {
      const includeSecrets =
        Boolean(input && typeof input === 'object' && (input as { includeSecrets?: boolean }).includeSecrets)

      const bundle = await profileManager.buildExportBundle(includeSecrets)
      const window = BrowserWindow.fromWebContents(event.sender)
      const defaultPath = `terminalssh-profiles-${new Date().toISOString().slice(0, 10)}.json`

      const result = window
        ? await dialog.showSaveDialog(window, {
            title: 'Sunucu profillerini dışa aktar',
            defaultPath,
            filters: [{ name: 'JSON', extensions: ['json'] }],
          })
        : await dialog.showSaveDialog({
            title: 'Sunucu profillerini dışa aktar',
            defaultPath,
            filters: [{ name: 'JSON', extensions: ['json'] }],
          })

      if (result.canceled || !result.filePath) {
        return { canceled: true as const }
      }

      writeFileSync(result.filePath, JSON.stringify(bundle, null, 2), 'utf8')

      return {
        canceled: false as const,
        path: result.filePath,
        count: bundle.profiles.length,
      }
    },
  )

  ipcMain.handle(IPC_CHANNELS.profiles.importFromFile, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)

    const result = window
      ? await dialog.showOpenDialog(window, {
          title: 'Sunucu profillerini içe aktar',
          properties: ['openFile'],
          filters: [{ name: 'JSON', extensions: ['json'] }, { name: 'All Files', extensions: ['*'] }],
        })
      : await dialog.showOpenDialog({
          title: 'Sunucu profillerini içe aktar',
          properties: ['openFile'],
          filters: [{ name: 'JSON', extensions: ['json'] }, { name: 'All Files', extensions: ['*'] }],
        })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true as const }
    }

    const filePath = result.filePaths[0]!
    const raw = readFileSync(filePath, 'utf8')
    const bundle = assertProfileExportBundle(JSON.parse(raw) as unknown)
    const imported = await profileManager.importFromBundle(bundle)

    return {
      canceled: false as const,
      count: imported.length,
    }
  })

  logger.debug('Profil IPC handler kayıtları tamamlandı')
}
