import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import {
  assertCollectIntelligenceRequest,
  assertGetServerOpsContextRequest,
  assertListTimelineRequest,
  assertRecordSuggestionRequest,
} from '@shared/validation/server-ops'

import { operationalTimelineStore } from '../services/operational-timeline-store'
import { serverOpsService } from '../services/server-ops-service'

import { createIpcHandler, createIpcVoidHandler } from './ipc-utils'

export function registerServerOpsHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.serverOps.getContext,
    createIpcHandler(assertGetServerOpsContextRequest, (event, payload) => {
      return serverOpsService.getContext(event.sender.id, payload.sessionId)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.serverOps.collectIntelligence,
    createIpcHandler(assertCollectIntelligenceRequest, async (event, payload) => {
      return serverOpsService.collectIntelligence(event.sender.id, payload.sessionId)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.serverOps.listTimeline,
    createIpcHandler(assertListTimelineRequest, (_event, payload) => {
      return serverOpsService.listTimeline(payload.serverKey, payload.limit)
    }),
  )

  ipcMain.handle(IPC_CHANNELS.serverOps.purgeTimeline, async () => {
    operationalTimelineStore.purgeExpired()
    return { ok: true }
  })

  ipcMain.handle(
    IPC_CHANNELS.serverOps.recordSuggestion,
    createIpcVoidHandler(assertRecordSuggestionRequest, (event, payload) => {
      serverOpsService.recordSuggestion(event.sender.id, payload.sessionId, {
        label: payload.label,
        command: payload.command,
      })
    }),
  )
}