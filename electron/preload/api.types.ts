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
  }
}

declare global {
  interface Window {
    desktopApi: DesktopApi
  }
}
