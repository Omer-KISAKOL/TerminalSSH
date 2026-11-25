import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import {
  assertCollectConfigDriftRequest,
  assertCollectIntelligenceRequest,
  assertGetServerOpsContextRequest,
  assertListTimelineRequest,
  assertRecordSuggestionRequest,
} from '@shared/validation/server-ops'

import { operationalTimelineStore } from '../services/operational-timeline-store'
import { serverOpsExtendedService } from '../services/server-ops-extended-service'
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
    IPC_CHANNELS.serverOps.collectDependencies,
    createIpcHandler(assertCollectIntelligenceRequest, async (event, payload) => {
      return serverOpsService.collectDependencies(event.sender.id, payload.sessionId)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.serverOps.collectProcesses,
    createIpcHandler(assertCollectIntelligenceRequest, async (event, payload) => {
      return serverOpsService.collectProcesses(event.sender.id, payload.sessionId)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.serverOps.collectDiskSpace,
    createIpcHandler(assertCollectIntelligenceRequest, async (event, payload) => {
      return serverOpsExtendedService.collectDiskSpace(event.sender.id, payload.sessionId)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.serverOps.collectConfigDrift,
    createIpcHandler(assertCollectConfigDriftRequest, async (event, payload) => {
      return serverOpsExtendedService.collectConfigDrift(event.sender.id, payload.sessionId, {
        resetBaseline: payload.resetBaseline,
      })
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.serverOps.collectEnvInspector,
    createIpcHandler(assertCollectIntelligenceRequest, async (event, payload) => {
      return serverOpsExtendedService.collectEnvInspector(event.sender.id, payload.sessionId)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.serverOps.collectEndpointMonitor,
    createIpcHandler(assertCollectIntelligenceRequest, async (event, payload) => {
      return serverOpsExtendedService.collectEndpointMonitor(event.sender.id, payload.sessionId)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.serverOps.collectIncidentAnalyzer,
    createIpcHandler(assertCollectIntelligenceRequest, async (event, payload) => {
      return serverOpsExtendedService.collectIncidentAnalyzer(event.sender.id, payload.sessionId)
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