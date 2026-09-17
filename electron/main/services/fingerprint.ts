import { createHash } from 'node:crypto'

export function makeHostKey(host: string, port: number): string {
  return `${host.trim().toLowerCase()}:${port}`
}

export function formatHostFingerprint(hostKey: Buffer): string {
  const base64 = createHash('sha256').update(hostKey).digest('base64').replace(/=+$/, '')
  return `SHA256:${base64}`
}
