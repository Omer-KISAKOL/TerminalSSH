const PRODUCTION_API_BASE_URL = 'http://188.34.155.223:8787'
const DEVELOPMENT_API_BASE_URL = 'http://localhost:8787'

export function resolveApiBaseUrl(): string {
  return import.meta.env.DEV ? DEVELOPMENT_API_BASE_URL : PRODUCTION_API_BASE_URL
}

/** Üretim derlemesinde canlı API; `vite` dev modunda yerel backend. */
export const API_BASE_URL = resolveApiBaseUrl()