export interface AuthUser {
  id: string
  email: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface LoginRequest {
  email: string
  password: string
  deviceName?: string
}

export interface RegisterRequest {
  email: string
  password: string
  deviceName?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  isLoading: boolean
  error: string | null
}
