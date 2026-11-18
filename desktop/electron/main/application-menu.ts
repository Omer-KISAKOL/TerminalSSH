import { BrowserWindow, Menu, app } from 'electron'

import { DEFAULT_APP_LOCALE, type AppLocale } from '@shared/i18n/locale'
import { APP_MENU_LABELS } from '@shared/i18n/menu-labels'
import { IPC_CHANNELS } from '@shared/ipc-channels'

function sendAppEventToRenderer(channel: string): void {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  window?.webContents.send(channel)
}

export function setupApplicationMenu(locale: AppLocale = DEFAULT_APP_LOCALE): void {
  const isMac = process.platform === 'darwin'
  const labels = APP_MENU_LABELS[locale]

  const sftpMenu: Electron.MenuItemConstructorOptions = {
    label: 'SFTP',
    submenu: [
      {
        label: labels.sftpNewTab,
        accelerator: 'CmdOrCtrl+Shift+F',
        click: () => sendAppEventToRenderer(IPC_CHANNELS.app.openSftpTab),
      },
      {
        label: labels.sftpFocusTab,
        accelerator: 'CmdOrCtrl+Alt+F',
        click: () => sendAppEventToRenderer(IPC_CHANNELS.app.focusSftpTab),
      },
    ],
  }

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            role: 'appMenu' as const,
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' as const } : { role: 'quit' as const, label: labels.quit },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    sftpMenu,
    { role: 'windowMenu' },
  ]

  if (isMac) {
    template.push({
      role: 'help',
      submenu: [
        {
          label: labels.about,
          click: () => {
            void app.showAboutPanel()
          },
        },
      ],
    })
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}