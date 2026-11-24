import { useCallback, useEffect, useRef, useState } from 'react'

import type { AuthUser, SessionResponse } from '@shared/contracts/auth'
import type { SecurityQuestionId } from '@shared/constants/security-questions'

type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  requiresSecuritySetup: boolean
  securitySetupToken: string | null
}

function toAuthErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback
  }

  const raw = error.message.trim()
  if (!raw) {
    return fallback
  }

  const ipcMatch = /^Error invoking remote method '[^']+':\s*(?:Error:\s*)?(.+)$/i.exec(raw)
  if (ipcMatch?.[1]?.trim()) {
    return ipcMatch[1].trim()
  }

  return raw
}

function applySessionResponse(response: SessionResponse): Pick<
  AuthState,
  'user' | 'isAuthenticated' | 'requiresSecuritySetup' | 'securitySetupToken' | 'error'
> {
  const requiresSecuritySetup = Boolean(response.requiresSecuritySetup)

  if (requiresSecuritySetup && response.user) {
    return {
      user: response.user,
      isAuthenticated: Boolean(response.isAuthenticated),
      requiresSecuritySetup: true,
      securitySetupToken: response.securitySetupToken ?? null,
      error: null,
    }
  }

  if (response.isAuthenticated && response.user) {
    return {
      user: response.user,
      isAuthenticated: true,
      requiresSecuritySetup: false,
      securitySetupToken: null,
      error: null,
    }
  }

  return {
    user: null,
    isAuthenticated: false,
    requiresSecuritySetup: false,
    securitySetupToken: null,
    error: null,
  }
}

export function useAuth() {
  const securitySetupTokenRef = useRef<string | null>(null)

  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    requiresSecuritySetup: false,
    securitySetupToken: null,
  })

  useEffect(() => {
    securitySetupTokenRef.current = state.securitySetupToken
  }, [state.securitySetupToken])

  const refreshSession = useCallback(async () => {
    try {
      const session = (await window.desktopApi.auth.getSession()) as SessionResponse
      setState({
        ...applySessionResponse(session),
        isLoading: false,
      })
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: toAuthErrorMessage(error, 'Oturum doğrulanamadı.'),
        requiresSecuritySetup: false,
        securitySetupToken: null,
      })
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const login = useCallback(async (email: string, password: string) => {
    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const response = (await window.desktopApi.auth.login({
        email,
        password,
        deviceName: 'Desktop',
      })) as SessionResponse

      if (response.requiresSecuritySetup) {
        setState({
          user: response.user,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          requiresSecuritySetup: true,
          securitySetupToken: response.securitySetupToken ?? null,
        })
        return response
      }

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        requiresSecuritySetup: false,
        securitySetupToken: null,
      })
      return response
    } catch (error) {
      const message = toAuthErrorMessage(error, 'Giriş başarısız.')
      setState((current) => ({ ...current, isLoading: false, error: message }))
      return
    }
  }, [])

  const register = useCallback(
    async (
      email: string,
      password: string,
      securityQuestionId: SecurityQuestionId,
      securityAnswer: string,
    ) => {
      setState((current) => ({ ...current, isLoading: true, error: null }))

      try {
        const session = await window.desktopApi.auth.register({
          email,
          password,
          securityQuestionId,
          securityAnswer,
          deviceName: 'Desktop',
        })
        setState({
          user: session.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          requiresSecuritySetup: false,
          securitySetupToken: null,
        })
        return session
      } catch (error) {
        const message = toAuthErrorMessage(error, 'Kayıt başarısız.')
        setState((current) => ({ ...current, isLoading: false, error: message }))
        return
      }
    },
    [],
  )

  const completeSecuritySetup = useCallback(
    async (securityQuestionId: SecurityQuestionId, securityAnswer: string) => {
      setState((current) => ({
        ...current,
        isLoading: true,
        error: null,
      }))

      try {
        const response = (await window.desktopApi.auth.completeSecuritySetup({
          securityQuestionId,
          securityAnswer,
          setupToken: securitySetupTokenRef.current ?? undefined,
          deviceName: 'Desktop',
        })) as SessionResponse

        setState({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          requiresSecuritySetup: false,
          securitySetupToken: null,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Güvenlik sorusu kaydedilemedi.'
        setState((current) => ({ ...current, isLoading: false, error: message }))
        throw error
      }
    },
    [],
  )

  const clearSecuritySetupPending = useCallback(() => {
    setState((current) => ({
      ...current,
      user: null,
      requiresSecuritySetup: false,
      securitySetupToken: null,
      error: null,
    }))
  }, [])

  const requestPasswordResetQuestion = useCallback(async (email: string) => {
    return window.desktopApi.auth.getPasswordResetQuestion({ email })
  }, [])

  const resetPassword = useCallback(async (email: string, securityAnswer: string, newPassword: string) => {
    await window.desktopApi.auth.resetPassword({ email, securityAnswer, newPassword })
  }, [])

  const logout = useCallback(async () => {
    await window.desktopApi.auth.logout()
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requiresSecuritySetup: false,
      securitySetupToken: null,
    })
  }, [])

  const isReadyForApp =
    state.isAuthenticated && !state.requiresSecuritySetup && Boolean(state.user)

  return {
    ...state,
    isReadyForApp,
    login,
    register,
    completeSecuritySetup,
    clearSecuritySetupPending,
    requestPasswordResetQuestion,
    resetPassword,
    logout,
    refreshSession,
  }
}