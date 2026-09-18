export const API_BASE_URL = 'http://188.34.155.223:8787'

export function resolveApiBaseUrl(): string {
  return process.env.TERMINALSSH_API_URL ?? API_BASE_URL
}
