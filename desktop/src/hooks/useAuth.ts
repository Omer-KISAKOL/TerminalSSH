import { useCallback, useEffect, useState } from 'react'

import type { AuthUser } from '@shared/contracts/auth'

type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  const refreshSession = useCallback(async () => {
    try {
      const session = await window.desktopApi.auth.getSession()
      setState({
        user: session.user,
        isAuthenticated: session.isAuthenticated,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Oturum doğrulanamadı.',
      })
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const login = useCallback(async (email: string, password: string) => {
    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const session = await window.desktopApi.auth.login({ email, password, deviceName: 'Desktop' })
      setState({
        user: session.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
      return session
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Giriş başarısız.'
      setState((current) => ({ ...current, isLoading: false, error: message }))
      throw error
    }
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    setState((current) => ({ ...current, isLoading: true, error: null }))

    try {
      const session = await window.desktopApi.auth.register({
        email,
        password,
        deviceName: 'Desktop',
      })
      setState({
        user: session.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
      return session
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kayıt başarısız.'
      setState((current) => ({ ...current, isLoading: false, error: message }))
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    await window.desktopApi.auth.logout()
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    login,
    register,
    logout,
    refreshSession,
  }
}
