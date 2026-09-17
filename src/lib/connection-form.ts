import type { ConnectionFormValues } from '@shared/contracts/ssh'

export const DEFAULT_CONNECTION_FORM: ConnectionFormValues = {
  host: '',
  port: '22',
  username: '',
  authType: 'password',
  password: '',
}

export function validateConnectionForm(values: ConnectionFormValues): string | null {
  if (values.host.trim().length === 0) {
    return 'Sunucu adresi boş olamaz.'
  }

  const port = Number.parseInt(values.port, 10)

  if (Number.isNaN(port) || port < 1 || port > 65535) {
    return 'Port 1–65535 arasında olmalı.'
  }

  if (values.username.trim().length === 0) {
    return 'Kullanıcı adı boş olamaz.'
  }

  if (values.authType === 'password' && values.password.length === 0) {
    return 'Parola boş olamaz.'
  }

  return null
}

export function getConnectionLabel(values: ConnectionFormValues): string {
  return `${values.username}@${values.host}:${values.port}`
}
