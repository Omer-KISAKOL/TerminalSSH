export type AppReleasePlatform =
  | 'desktop-windows'
  | 'desktop-linux'
  | 'desktop-macos'
  | 'android'

export type DesktopUpdatePhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error'

export interface ReleaseCheckResponse {
  updateAvailable: boolean
  currentVersion: string
  latestVersion: string | null
  downloadUrl: string | null
  releaseNotes: string | null
  phase?: DesktopUpdatePhase
  percent?: number | null
  nativeAutoUpdate?: boolean
  errorMessage?: string | null
}