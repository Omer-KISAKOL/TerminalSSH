import { ipcMain } from 'electron'

import { IPC_CHANNELS } from '@shared/ipc-channels'
import { assertLoginRequest, assertRegisterRequest } from '@shared/validation/auth'

import { authStore } from '../services/auth-store'
import { TerminalSshApiClient } from '@terminalssh/api-client'

import { createIpcHandler } from './ipc-utils'

function getApiClient(): TerminalSshApiClient {
  return new TerminalSshApiClient({
    baseUrl: process.env.TERMINALSSH_API_URL ?? 'http://localhost:8787',
    getAccessToken: () => authStore.getSession()?.accessToken ?? null,
    getRefreshToken: () => authStore.getSession()?.refreshToken ?? null,
    onSessionUpdate: (session) => {
      authStore.setSession(session)
    },
  })
}

export function registerAuthHandlers(): void {
  ipcMain.handle(
    IPC_CHANNELS.auth.register,
    createIpcHandler(assertRegisterRequest, async (_event, payload) => {
      const client = getApiClient()
      const session = await client.register(payload.email, payload.password, payload.deviceName)
      authStore.setSession(session)
      return {
        user: session.user,
        isAuthenticated: true,
      }
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.auth.login,
    createIpcHandler(assertLoginRequest, async (_event, payload) => {
      const client = getApiClient()
      const session = await client.login(payload.email, payload.password, payload.deviceName)
      authStore.setSession(session)
      return {
        user: session.user,
        isAuthenticated: true,
      }
    }),
  )

  ipcMain.handle(IPC_CHANNELS.auth.logout, async () => {
    const session = authStore.getSession()

    if (session) {
      try {
        await getApiClient().logout(session.refreshToken)
      } catch {
        // Ignore remote logout failures.
      }
    }

    authStore.clearSession()
    return { isAuthenticated: false }
  })

  ipcMain.handle(IPC_CHANNELS.auth.refresh, async () => {
    const session = authStore.getSession()

    if (!session) {
      return { isAuthenticated: false, user: null }
    }

    const refreshed = await getApiClient().refresh(session.refreshToken)
    authStore.setSession(refreshed)
    return { user: refreshed.user, isAuthenticated: true }
  })

  ipcMain.handle(IPC_CHANNELS.auth.getSession, async () => {
    const session = authStore.getSession()

    if (!session) {
      return { isAuthenticated: false, user: null }
    }

    try {
      const me = await getApiClient().me()
      return { isAuthenticated: true, user: me.user }
    } catch {
      authStore.clearSession()
      return { isAuthenticated: false, user: null }
    }
  })
}
