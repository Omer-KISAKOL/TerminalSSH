import type { AppLocale } from './locale'

export type AppMenuLabels = {
  quit: string
  sftpNewTab: string
  sftpFocusTab: string
  about: string
}

export const APP_MENU_LABELS: Record<AppLocale, AppMenuLabels> = {
  tr: {
    quit: 'Çıkış',
    sftpNewTab: 'Yeni SFTP sekmesi',
    sftpFocusTab: 'SFTP sekmesine geç',
    about: 'Hakkında TerminalSSH',
  },
  en: {
    quit: 'Quit',
    sftpNewTab: 'New SFTP tab',
    sftpFocusTab: 'Switch to SFTP tab',
    about: 'About TerminalSSH',
  },
}