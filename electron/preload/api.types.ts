import type { HostVerifyRequestEvent } from '@shared/contracts/host'
import type { PublicServerProfile, SaveProfileRequest } from '@shared/contracts/profile'
import type {
  ConnectRequest,
  ConnectResponse,
  SshDataEvent,
  SshStatusEvent,
} from '@shared/contracts/ssh'

export interface DesktopApi {
  app: {
    getVersion(): Promise<string>
  }
  ssh: {
    connect(input: ConnectRequest): Promise<ConnectResponse>
    write(sessionId: string, data: string): Promise<void>
    resize(sessionId: string, cols: number, rows: number): Promise<void>
    disconnect(sessionId: string): Promise<void>
    onData(callback: (event: SshDataEvent) => void): () => void
    onStatus(callback: (event: SshStatusEvent) => void): () => void
    onHostVerifyRequest(callback: (event: HostVerifyRequestEvent) => void): () => void
    respondHostVerification(verificationId: string, approved: boolean): Promise<void>
  }
  profiles: {
    list(): Promise<PublicServerProfile[]>
    save(input: SaveProfileRequest): Promise<PublicServerProfile>
    remove(id: string): Promise<void>
  }
  files: {
    selectPrivateKey(): Promise<string | null>
  }
}

declare global {
  interface Window {
    desktopApi: DesktopApi
  }
}
