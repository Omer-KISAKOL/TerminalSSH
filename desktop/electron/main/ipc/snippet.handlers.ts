import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import {
  assertProfileId,
  assertSaveSnippetRequest,
  assertSnippetId,
} from '@shared/validation/snippet'

import { snippetManager } from '../services/snippet-manager'

import { createIpcHandler, createIpcVoidHandler } from './ipc-utils'

export function registerSnippetHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.snippets.list,
    createIpcHandler((input) => assertProfileId(typeof input === 'string' ? input : ''), async (_event, profileId) => {
      return snippetManager.list(profileId)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.snippets.save,
    createIpcHandler(assertSaveSnippetRequest, async (_event, request) => {
      return snippetManager.save(request)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.snippets.remove,
    createIpcVoidHandler(
      (input: unknown) => {
        if (!input || typeof input !== 'object') {
          throw new Error('Geçersiz snippet silme isteği.')
        }

        const value = input as { profileId?: string; snippetId?: string }

        return {
          profileId: assertProfileId(value.profileId ?? ''),
          snippetId: assertSnippetId(value.snippetId ?? ''),
        }
      },
      async (_event, payload) => {
        await snippetManager.remove(payload.profileId, payload.snippetId)
      },
    ),
  )
}
