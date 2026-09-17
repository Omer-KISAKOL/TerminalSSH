import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import {
  assertConnectRequest,
  assertDisconnectPayload,
  assertResizePayload,
  assertWritePayload,
  IpcValidationError,
} from '@shared/validation/ssh'

import { logger } from '../services/logger'
import { sshSessionManager } from '../services/ssh-session-manager'

function handleValidationError(error: unknown): never {
  if (error instanceof IpcValidationError) {
    throw new Error(error.message)
  }

  throw error
}

export function registerSshHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.ssh.connect, async (event, input) => {
    try {
      const request = assertConnectRequest(input)
      return await sshSessionManager.connect(event.sender.id, request)
    } catch (error) {
      handleValidationError(error)
    }
  })

  ipcMain.handle(IPC_CHANNELS.ssh.write, (event, input) => {
    try {
      const payload = assertWritePayload(input)
      sshSessionManager.write(event.sender.id, payload.sessionId, payload.data)
    } catch (error) {
      handleValidationError(error)
    }
  })

  ipcMain.handle(IPC_CHANNELS.ssh.resize, (event, input) => {
    try {
      const payload = assertResizePayload(input)
      sshSessionManager.resize(event.sender.id, payload.sessionId, payload.cols, payload.rows)
    } catch (error) {
      handleValidationError(error)
    }
  })

  ipcMain.handle(IPC_CHANNELS.ssh.disconnect, (event, input) => {
    try {
      const payload = assertDisconnectPayload(input)
      sshSessionManager.disconnect(event.sender.id, payload.sessionId)
    } catch (error) {
      handleValidationError(error)
    }
  })

  logger.debug('SSH IPC handler kayıtları tamamlandı')
}
