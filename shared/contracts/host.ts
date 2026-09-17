export type HostVerifyKind = 'unknown' | 'mismatch'

export interface HostVerifyRequestEvent {
  verificationId: string
  sessionId: string
  host: string
  port: number
  fingerprint: string
  kind: HostVerifyKind
  expectedFingerprint?: string
}

export interface HostVerifyResponse {
  verificationId: string
  approved: boolean
}

export interface KnownHostRecord {
  fingerprint: string
  addedAt: string
}
