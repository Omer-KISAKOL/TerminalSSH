import { ipcMain } from 'electron'

import { getApiBaseUrl as resolveApiBaseUrl } from '../api-base-url'
import { IPC_CHANNELS } from '@shared/ipc-channels'
import {
  assertLoginRequest,
  assertPasswordResetConfirmRequest,
  assertPasswordResetQuestionRequest,
  assertRegisterRequest,
  assertSecuritySetupRequest,
} from '@shared/validation/auth'

import {
  remoteCompleteSecuritySetupAuthenticated,
  remoteCompleteSecuritySetupWithToken,
  remoteFetchMe,
} from '../services/auth-remote'
import { authStore } from '../services/auth-store'
import { TerminalSshApiClient } from '@terminalssh/api-client'

import { createIpcHandler } from './ipc-utils'

function getApiClient(): TerminalSshApiClient {
  return new TerminalSshApiClient({
    baseUrl: resolveApiBaseUrl(),
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
      const session = await client.register({
        email: payload.email,
        password: payload.password,
        securityQuestionId: payload.securityQuestionId,
        securityAnswer: payload.securityAnswer,
        deviceName: payload.deviceName,
      })
      authStore.setSession(session)
      return {
        user: session.user,
        isAuthenticated: true,
        requiresSecuritySetup: false,
      }
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.auth.login,
    createIpcHandler(assertLoginRequest, async (_event, payload) => {
      const client = getApiClient()
      const result = await client.login(payload.email, payload.password, payload.deviceName)

      if ('requiresSecuritySetup' in result && result.requiresSecuritySetup) {
        return {
          user: result.user,
          isAuthenticated: false,
          requiresSecuritySetup: true,
          securitySetupToken: result.setupToken,
        }
      }

      authStore.setSession(result)
      return {
        user: result.user,
        isAuthenticated: true,
        requiresSecuritySetup: false,
      }
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.auth.completeSecuritySetup,
    createIpcHandler(assertSecuritySetupRequest, async (_event, payload) => {
      const baseUrl = resolveApiBaseUrl()

      if (payload.setupToken) {
        const session = await remoteCompleteSecuritySetupWithToken(baseUrl, {
          setupToken: payload.setupToken,
          securityQuestionId: payload.securityQuestionId,
          securityAnswer: payload.securityAnswer,
          deviceName: payload.deviceName,
        })
        authStore.setSession(session)
        return {
          user: session.user,
          isAuthenticated: true,
          requiresSecuritySetup: false,
        }
      }

      const accessToken = authStore.getSession()?.accessToken

      if (!accessToken) {
        throw new Error('Oturum bulunamadı.')
      }

      await remoteCompleteSecuritySetupAuthenticated(baseUrl, accessToken, {
        securityQuestionId: payload.securityQuestionId,
        securityAnswer: payload.securityAnswer,
      })

      const session = authStore.getSession()

      if (!session) {
        throw new Error('Oturum bulunamadı.')
      }

      return {
        user: session.user,
        isAuthenticated: true,
        requiresSecuritySetup: false,
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

  ipcMain.handle(
    IPC_CHANNELS.auth.getPasswordResetQuestion,
    createIpcHandler(assertPasswordResetQuestionRequest, async (_event, payload) => {
      return getApiClient().getPasswordResetQuestion(payload.email)
    }),
  )

  ipcMain.handle(
    IPC_CHANNELS.auth.resetPassword,
    createIpcHandler(assertPasswordResetConfirmRequest, async (_event, payload) => {
      await getApiClient().resetPasswordWithSecurityAnswer(
        payload.email,
        payload.securityAnswer,
        payload.newPassword,
      )
      return { ok: true }
    }),
  )

  ipcMain.handle(IPC_CHANNELS.auth.getSession, async () => {
    const session = authStore.getSession()

    if (!session) {
      return { isAuthenticated: false, user: null, requiresSecuritySetup: false }
    }

    try {
      const me = await remoteFetchMe(resolveApiBaseUrl(), session.accessToken)
      return {
        isAuthenticated: true,
        user: me.user,
        requiresSecuritySetup: me.requiresSecuritySetup,
      }
    } catch {
      try {
        const refreshed = await getApiClient().refresh(session.refreshToken)
        authStore.setSession(refreshed)
        const me = await remoteFetchMe(resolveApiBaseUrl(), refreshed.accessToken)
        return {
          isAuthenticated: true,
          user: me.user,
          requiresSecuritySetup: me.requiresSecuritySetup,
        }
      } catch {
        authStore.clearSession()
        return { isAuthenticated: false, user: null, requiresSecuritySetup: false }
      }
    }
  })
}
