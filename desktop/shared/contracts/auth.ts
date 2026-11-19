import type { SecurityQuestionId } from '@shared/constants/security-questions'

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
  securityQuestionId: SecurityQuestionId
  securityAnswer: string
}

export interface PasswordResetQuestionRequest {
  email: string
}

export interface PasswordResetQuestionResponse {
  securityQuestionId: SecurityQuestionId
}

export interface PasswordResetConfirmRequest {
  email: string
  securityAnswer: string
  newPassword: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  requiresSecuritySetup: boolean
  securitySetupToken: string | null
}

export interface SecuritySetupRequest {
  securityQuestionId: SecurityQuestionId
  securityAnswer: string
  setupToken?: string
  deviceName?: string
}

export interface SessionResponse {
  user: AuthUser | null
  isAuthenticated: boolean
  requiresSecuritySetup?: boolean
  securitySetupToken?: string | null
}
