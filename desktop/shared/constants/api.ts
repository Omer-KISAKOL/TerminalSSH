export const PRODUCTION_API_BASE_URL = 'http://188.34.155.223:8787'
export const DEVELOPMENT_API_BASE_URL = 'http://localhost:8787'

/** Paketlenmiş uygulamada canlı API; geliştirme modunda yerel backend. */
export function resolveApiBaseUrl(isDev: boolean): string {
  return isDev ? DEVELOPMENT_API_BASE_URL : PRODUCTION_API_BASE_URL
}
