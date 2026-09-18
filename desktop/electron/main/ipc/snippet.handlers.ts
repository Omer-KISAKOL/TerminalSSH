import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import { assertSaveSnippetRequest, assertSnippetId } from '@shared/validation/snippet'

import { snippetManager } from '../services/snippet-manager'

import { createIpcHandler, createIpcVoidHandler } from './ipc-utils'

export function registerSnippetHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.snippets.list, async () => {
    return snippetManager.list()
  })

  ipcMain.handle(
    IPC_CHANNELS.snippets.save,
    createIpcHandler(assertSaveSnippetRequest, async (_event, request) => {
      return snippetManager.save(request)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.snippets.remove,
    createIpcVoidHandler(
      (input: unknown) => assertSnippetId(typeof input === 'string' ? input : ''),
      async (_event, snippetId) => {
        await snippetManager.remove(snippetId)
      },
    ),
  )
}
