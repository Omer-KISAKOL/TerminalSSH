import type { AuthSession, AuthUser } from '@terminalssh/api-client'
import { ApiClientError } from '@terminalssh/api-client'

import type { SecurityQuestionId } from '@shared/constants/security-questions'

async function parseJsonResponse<T>(response: Response): Promise<T> {
  let payload: (T & { error?: string; message?: string }) | null = null

  try {
    payload = (await response.json()) as T & { error?: string; message?: string }
  } catch {
    if (!response.ok) {
      throw new ApiClientError(
        response.status === 429
          ? 'Çok fazla istek gönderildi. Lütfen kısa bir süre bekleyin.'
          : `API isteği başarısız (HTTP ${response.status}).`,
        response.status,
      )
    }

    throw new ApiClientError('API yanıtı okunamadı.', response.status)
  }

  if (!response.ok) {
    throw new ApiClientError(
      payload.message ?? payload.error ?? 'API isteği başarısız.',
      response.status,
    )
  }

  return payload
}

export async function remoteCompleteSecuritySetupWithToken(
  baseUrl: string,
  input: {
    setupToken: string
    securityQuestionId: SecurityQuestionId
    securityAnswer: string
    deviceName?: string
  },
): Promise<AuthSession> {
  const response = await fetch(`${baseUrl}/auth/security-setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      setupToken: input.setupToken,
      securityQuestionId: input.securityQuestionId,
      securityAnswer: input.securityAnswer,
      deviceName: input.deviceName,
    }),
  })

  return parseJsonResponse<AuthSession>(response)
}

export async function remoteCompleteSecuritySetupAuthenticated(
  baseUrl: string,
  accessToken: string,
  input: {
    securityQuestionId: SecurityQuestionId
    securityAnswer: string
  },
): Promise<void> {
  const response = await fetch(`${baseUrl}/auth/security-setup/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  })

  await parseJsonResponse<{ ok: boolean }>(response)
}

export async function remoteFetchMe(
  baseUrl: string,
  accessToken: string,
): Promise<{ user: AuthUser; requiresSecuritySetup: boolean }> {
  const response = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const payload = await parseJsonResponse<{ user: AuthUser; requiresSecuritySetup?: boolean }>(response)

  return {
    user: payload.user,
    requiresSecuritySetup: Boolean(payload.requiresSecuritySetup),
  }
}