import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import {
  assertSftpConnectRequest,
  assertSftpListDirRequest,
  assertSftpSessionPayload,
  assertSftpTransferRequest,
} from '@shared/validation/sftp'

import { profileManager } from '../services/profile-manager'
import { resolveSftpConnectRequest } from '../services/sftp-connect-resolver'
import { sftpSessionManager } from '../services/sftp-session-manager'

import { createIpcHandler, createIpcVoidHandler } from './ipc-utils'

export function registerSftpHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.sftp.connect,
    createIpcHandler(assertSftpConnectRequest, async (event, request) => {
      const resolved = await resolveSftpConnectRequest(request)
      const response = await sftpSessionManager.connect(event.sender.id, resolved)

      if (resolved.profileId) {
        void profileManager.updateLastConnected(resolved.profileId)
      }

      return response
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.sftp.listDir,
    createIpcHandler(assertSftpListDirRequest, (event, payload) => {
      return sftpSessionManager.listDirectory(
        event.sender.id,
        payload.sessionId,
        payload.path,
      )
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.sftp.upload,
    createIpcVoidHandler(assertSftpTransferRequest, (event, payload) => {
      return sftpSessionManager.upload(
        event.sender.id,
        payload.sessionId,
        payload.localPath,
        payload.remotePath,
      )
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.sftp.download,
    createIpcVoidHandler(assertSftpTransferRequest, (event, payload) => {
      return sftpSessionManager.download(
        event.sender.id,
        payload.sessionId,
        payload.remotePath,
        payload.localPath,
      )
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.sftp.disconnect,
    createIpcVoidHandler(assertSftpSessionPayload, (event, payload) => {
      sftpSessionManager.disconnect(event.sender.id, payload.sessionId)
    }),
  )
}
