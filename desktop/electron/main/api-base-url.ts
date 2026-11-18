import { app } from 'electron'

import { resolveApiBaseUrl } from '@shared/constants/api'

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl(!app.isPackaged)
}
