import type { AppReleasePlatform } from '@shared/contracts/release'

export function resolveDesktopReleasePlatform(): AppReleasePlatform {
  if (process.platform === 'win32') {
    return 'desktop-windows'
  }

  if (process.platform === 'darwin') {
    return 'desktop-macos'
  }

  return 'desktop-linux'
}