import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import {
  assertConnectRequest,
  assertDisconnectPayload,
  assertResizePayload,
  assertWritePayload,
} from '@shared/validation/ssh'
import { assertHostVerifyResponse } from '@shared/validation/host'

import { resolveConnectRequest } from '../services/connect-resolver'
import { hostVerificationService } from '../services/host-verification-service'
import { logger } from '../services/logger'
import { profileManager } from '../services/profile-manager'
import { sshSessionManager } from '../services/ssh-session-manager'

import { createIpcHandler, createIpcVoidHandler } from './ipc-utils'

export function registerSshHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.ssh.connect,
    createIpcHandler(assertConnectRequest, async (event, request) => {
      const resolved = await resolveConnectRequest(request)
      const response = await sshSessionManager.connect(event.sender.id, resolved)

      if (resolved.profileId) {
        void profileManager.updateLastConnected(resolved.profileId)
      }

      return response
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.ssh.write,
    createIpcVoidHandler(assertWritePayload, (event, payload) => {
      sshSessionManager.write(event.sender.id, payload.sessionId, payload.data)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.ssh.resize,
    createIpcVoidHandler(assertResizePayload, (event, payload) => {
      sshSessionManager.resize(
        event.sender.id,
        payload.sessionId,
        payload.cols,
        payload.rows,
      )
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.ssh.disconnect,
    createIpcVoidHandler(assertDisconnectPayload, (event, payload) => {
      sshSessionManager.disconnect(event.sender.id, payload.sessionId)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.ssh.hostVerifyRespond,
    createIpcVoidHandler(assertHostVerifyResponse, (event, payload) => {
      hostVerificationService.respond(
        payload.verificationId,
        payload.approved,
        event.sender.id,
      )
    }),
  )

  logger.debug('SSH IPC handler kayıtları tamamlandı')
}
